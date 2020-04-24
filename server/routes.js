const request = require('request');
const parser = require('fast-xml-parser');

function parseXML(xml, method) {
  let json = parser.parse(xml.body);
  return json['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns1:' + method + 'Response'];
}

async function routes(fastify) {
  fastify.get('/calendar', async (req, res) => {
    let day = req.query.day;
    let month = req.query.month;
    let options = {
      'method': 'POST',
      'url': 'http://pis.predmety.fiit.stuba.sk/pis/ws/Calendar',
      'headers': {
        'Content-Type': ['text/xml', 'application/xml']
      },
      'body': `<?xml version="1.0" encoding="utf-8"?>
               <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/calendar/types">
                 <soapenv:Header/>
                 <soapenv:Body>
                   <typ:getSunrise>
                     <month>${month}</month>
                     <day>${day}</day>
                   </typ:getSunrise>
                 </soapenv:Body>
               </soapenv:Envelope>`

    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      res.send(parseXML(response, 'getSunrise'));
    });

  })

  fastify.get('/cities', async (req, res) => {
    let name = req.query.name;
    let options = {
      'method': 'POST',
      'url': 'http://pis.predmety.fiit.stuba.sk/pis/ws/GeoServices/CitiesSK',
      'headers': {
        'Content-Type': ['text/xml', 'application/xml']
      },
      'body': `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/geoservices/citiessk/types">
                 <soapenv:Header/>
                 <soapenv:Body>
                   <typ:searchByName>
                     <name>${name}</name>
                   </typ:searchByName>
                 </soapenv:Body>
               </soapenv:Envelope>`

    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      res.send(parseXML(response, 'searchByName'));
    });

  })

//odtialto zacinaju bengere


}

module.exports = routes
