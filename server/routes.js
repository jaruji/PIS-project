const request = require('request');
const parser = require('fast-xml-parser');

function parseXML(xml, method) {
  let json = parser.parse(xml.body);
  return json['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns1:' + method + 'Response'];
}

function doRequest(req) {

  return new Promise(function(resolve, reject) {
    request(req.body, function (error, response, body) {
      if (error) reject(error);
      resolve(parseXML(response, req.method));
    });
  });
}

async function routes(fastify) {
//odtialto zacinaju bengere

fastify.get('/games', async (req, res) => {
  let gamesResponse;
  let hra_id;

  let gamesRequest = {
    method: 'getAll',
    body: {
      method: 'POST',
      url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106hra',
      headers: {
        'Content-Type': ['text/xml', 'application/xml']
      },
      body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106hra/types">
                <soapenv:Header/>
                <soapenv:Body>
                  <typ:getAll/>
                </soapenv:Body>
              </soapenv:Envelope>`
    }
  };

  gamesResponse = await doRequest(gamesRequest);
  gamesResponse = gamesResponse.hras.hra;
  for(let i in gamesResponse) {
    hra_id = gamesResponse[i].id;
    gamesResponse[i].obrazky = [];
    // console.log(imagesRequest.hra_id);
    let images = await doRequest({
      method: 'getByAttributeValue',
      body: {
        method: 'POST',
        url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106obrazok',
        headers: {
          'Content-Type': ['text/xml', 'application/xml']
        },
        body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106obrazok/types">
                   <soapenv:Header/>
                   <soapenv:Body>
                      <typ:getByAttributeValue>
                         <attribute_name>hra_id</attribute_name>
                         <attribute_value>${hra_id}</attribute_value>
                         <ids>
                            <id></id>
                         </ids>
                      </typ:getByAttributeValue>
                   </soapenv:Body>
                </soapenv:Envelope>`
      }
    });
    images = images.obrazoks.obrazok;

    if(images.length === undefined)
      gamesResponse[i].obrazky.push(images.img)
    else if(images !== null) {
      images.forEach(img => {
        gamesResponse[i].obrazky.push(img.img);
      })
    }

    let _categories = await doRequest({
      method: 'getByAttributeValue',
      body: {
        method: 'POST',
        url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106kategorie_hry',
        headers: {
          'Content-Type': ['text/xml', 'application/xml']
        },
        body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106kategorie_hry/types">
                 <soapenv:Header/>
                 <soapenv:Body>
                    <typ:getByAttributeValue>
                       <attribute_name>hra_id</attribute_name>
                       <attribute_value>${hra_id}</attribute_value>
                       <ids>
                          <id></id>
                       </ids>
                    </typ:getByAttributeValue>
                 </soapenv:Body>
              </soapenv:Envelope>`
      }
    });

    let category_ids = [];
    _categories = _categories['kategorie_hrys']['kategorie_hry'];

    if(_categories.length === undefined)
      category_ids.push(_categories.kategoria_id);
    else if(_categories !== null) {
      _categories.forEach(key => {
        category_ids.push(key.kategoria_id);
      })
    }

    gamesResponse[i].kategorie = [];
    for(let j in category_ids) {
      let category = await doRequest({
        method: 'getByAttributeValue',
        body: {
          method: 'POST',
          url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106kategoria',
          headers: {
            'Content-Type': ['text/xml', 'application/xml']
          },
          body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106kategoria/types">
                   <soapenv:Header/>
                   <soapenv:Body>
                      <typ:getByAttributeValue>
                         <attribute_name>id</attribute_name>
                         <attribute_value>${category_ids[j]}</attribute_value>
                         <ids>
                            <id></id>
                         </ids>
                      </typ:getByAttributeValue>
                   </soapenv:Body>
                  </soapenv:Envelope>`
        }
      });

      category = category.kategorias.kategoria;
      gamesResponse[i].kategorie.push(category.typ);
    }
  }



  res.send(gamesResponse);
})

}

module.exports = routes
