const request = require('request');
const parser = require('fast-xml-parser');

function parseXML(xml, method) {
  let json = parser.parse(xml.body);
  return json['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns1:' + method + 'Response'];
}

async function getImages(id) {


}

async function routes(fastify) {
//odtialto zacinaju bengere

fastify.get('/games', async (req, res) => {
  let gamesResponse;
  let hra_id;
  let gamesRequest = {
    'method': 'POST',
    'url': 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106hra',
    'headers': {
      'Content-Type': ['text/xml', 'application/xml']
    },
    'body': `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106hra/types">
              <soapenv:Header/>
              <soapenv:Body>
                <typ:getAll/>
              </soapenv:Body>
            </soapenv:Envelope>`
  };


  request(gamesRequest, function (error, response) {
    if (error) throw new Error(error);
    gamesResponse = parseXML(response, 'getAll');
    gamesResponse = gamesResponse.hras.hra;

    for(let i = 0; i < gamesResponse.length; i++) {
      hra_id = gamesResponse[i].id;
      let imagesRequest = {
        'method': 'POST',
        'url': 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106obrazok',
        'headers': {
          'Content-Type': ['text/xml', 'application/xml']
        },
        'body': `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106obrazok/types">
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
      };

      gamesResponse[i].obrazky = [];
      let images;
      request(imagesRequest, function (error, response) {
        if (error) throw new Error(error);
        images = parseXML(response, 'getByAttributeValue');
        images = images.obrazoks.obrazok;
        images.forEach(img => {
          gamesResponse[i].obrazky.push(img.img);
        })

        if(i === gamesResponse.length - 1)
          res.send(gamesResponse);
      });
    }
  });

})

}

module.exports = routes
