const request = require('request');
const parser = require('fast-xml-parser');
const sha256 = require('js-sha256');
const crypto = require('crypto')
const gpc = require('generate-pincode')

function parseXML(xml, method) {
  let json = parser.parse(xml.body);
  return json['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns1:' + method + 'Response'];
}


function doRequest(req){
  return new Promise(function(resolve, reject){
    request(req.body, function (error, response, body){
      if (error) reject(error);
      resolve(parseXML(response, req.method));
    });
  });
}


async function routes(fastify){
  fastify.get('/game', async (req, res) => {
    let hra_id = req.query.id;
    let gamesResponse = await doRequest({
      method: 'getByAttributeValue',
      body: {
        method: 'POST',
        url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106hra',
        headers: {
          'Content-Type': ['text/xml', 'application/xml']
        },
        body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106hra/types">
                     <soapenv:Header/>
                     <soapenv:Body>
                        <typ:getByAttributeValue>
                           <attribute_name>id</attribute_name>
                           <attribute_value>${hra_id}</attribute_value>
                           <ids>
                              <id></id>
                           </ids>
                        </typ:getByAttributeValue>
                     </soapenv:Body>
                  </soapenv:Envelope>`
      }
    });
    gamesResponse = gamesResponse.hras.hra;
    gamesResponse.obrazky = [];
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
      gamesResponse.obrazky.push(images.img)
    else if(images !== null){
      images.forEach(img => {
        gamesResponse.obrazky.push(img.img);
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
    gamesResponse.kategorie = [];
    for(let i in category_ids){
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
                         <attribute_value>${category_ids[i]}</attribute_value>
                         <ids>
                            <id></id>
                         </ids>
                      </typ:getByAttributeValue>
                   </soapenv:Body>
                  </soapenv:Envelope>`
        }
      });
      category = category.kategorias.kategoria;
      gamesResponse.kategorie.push(category.typ);
    }
    res.send(gamesResponse);
  })


  fastify.get('/games', async(req, res) => {
    let gamesResponse = await doRequest({
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
    });
    gamesResponse = gamesResponse.hras.hra;
    let hra_id = null
    for(let i in gamesResponse){
      hra_id = gamesResponse[i].id
      gamesResponse[i].obrazky = []
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
      else if(images !== null){
        images.forEach(img => {
          gamesResponse[i].obrazky.push(img.img);
        })
      }
    }
    res.send(gamesResponse)
  })


  fastify.post('/login', async(req, res) => {
    let reader = await doRequest({
      method: 'getByAttributeValue',
      body: {
        method: 'POST',
        url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106citatel',
        headers: {
          'Content-Type': ['text/xml', 'application/xml']
        },
        body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106citatel/types">
                 <soapenv:Header/>
                 <soapenv:Body>
                    <typ:getByAttributeValue>
                       <attribute_name>email</attribute_name>
                       <attribute_value>${req.body.email}</attribute_value>
                       <ids>
                          <id></id>
                       </ids>
                    </typ:getByAttributeValue>
                 </soapenv:Body>
              </soapenv:Envelope>`
      }
    });
    let bookmaker = await doRequest({
      method: 'getByAttributeValue',
      body: {
        method: 'POST',
        url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106knihovnik',
        headers: {
          'Content-Type': ['text/xml', 'application/xml']
        },
        body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106knihovnik/types">
                 <soapenv:Header/>
                 <soapenv:Body>
                    <typ:getByAttributeValue>
                       <attribute_name>email</attribute_name>
                       <attribute_value>${req.body.email}</attribute_value>
                       <ids>
                          <id></id>
                       </ids>
                    </typ:getByAttributeValue>
                 </soapenv:Body>
              </soapenv:Envelope>`
      }
    });
    reader = reader.citatels.citatel;
    bookmaker = bookmaker.knihovniks.knihovnik;
    if(reader != undefined){
      let readerSHA = sha256(req.body.heslo);
        if(readerSHA === reader.heslo)
          res.send({id: citatel.id, response: "citatel"})
        else
          res.code(400).send(new Error("Nesprávne prihlasovacie údaje"))
    }
    else if(bookmaker != undefined){
      let bookmakerSHA = sha256(req.body.heslo);
      if(bookmakerSHA === bookmaker.heslo)
        res.send({id: bookmaker.id, response: "knihovnik"})
      else
        res.code(400).send(new Error("Nesprávne prihlasovacie údaje"))
    }
    else
      res.code(400).send(new Error("Nesprávne prihlasovacie údaje"))
  })

  fastify.get('/checkSelectedDate', async(req, res) => {
    let hra_id = req.query.id;
    let dateFrom = new Date(req.query.dateFrom);
    let dateTo = new Date(req.query.dateTo);
    let exemplars = await doRequest({
      method: 'getByAttributeValue',
      body: {
        method: 'POST',
        url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106exemplar',
        headers: {
          'Content-Type': ['text/xml', 'application/xml']
        },
        body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106exemplar/types">
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
    exemplars = exemplars.exemplars.exemplar;
    if(exemplars === undefined) {
      res.send({response: "Not available"});
      return;
    }
    let reservations = [];
    for(let i in exemplars) {
      let _reservations = await doRequest({
        method: 'getByAttributeValue',
        body: {
          method: 'POST',
          url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106rezervacia',
          headers: {
            'Content-Type': ['text/xml', 'application/xml']
          },
          body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106rezervacia/types">
                   <soapenv:Header/>
                   <soapenv:Body>
                      <typ:getByAttributeValue>
                         <attribute_name>exemplar_id</attribute_name>
                         <attribute_value>${exemplars[i].id}</attribute_value>
                         <ids>
                            <id></id>
                         </ids>
                      </typ:getByAttributeValue>
                   </soapenv:Body>
                </soapenv:Envelope>`
        }
      });
      _reservations = _reservations.rezervacias.rezervacia;
      if(_reservations !== undefined) {
        if(_reservations.length === undefined)
          reservations.push(_reservations);
        else {
          for(let j in _reservations)
            reservations.push(_reservations[j]);
        }
      }
    }
    exemplars = exemplars.filter((x) => { return x.stav !== "Vyradená"; });
    reservations = reservations.filter((x) => { return x.stav === "Vybavená" || x.stav === "Vybavuje sa" });
    if(reservations.length === 0) {
      res.send(exemplars);
      return;
    }
    for(let i in reservations) {
      if((dateFrom >= new Date(reservations[i].datum_od) && dateFrom <= new Date(reservations[i].datum_do)) || (dateTo >= new Date(reservations[i].datum_od) && dateTo <= new Date(reservations[i].datum_do)))
        exemplars = exemplars.filter((x) => { return x.id !== reservations[i].exemplar_id });
    }
    if(exemplars.length === 0)
      res.send({ response: "Not available" });
    else
      res.send(exemplars);
  })


  fastify.get('/checkLicence', async(req, res) => {
    let id = req.query.id
    let licence = await doRequest({
      method: 'getByAttributeValue',
      body: {
        method: 'POST',
        url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106preukaz',
        headers: {
          'Content-Type': ['text/xml', 'application/xml']
        },
        body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106preukaz/types">
                 <soapenv:Header/>
                 <soapenv:Body>
                    <typ:getByAttributeValue>
                       <attribute_name>id</attribute_name>
                       <attribute_value>${id}</attribute_value>
                       <ids>
                          <id></id>
                       </ids>
                    </typ:getByAttributeValue>
                 </soapenv:Body>
              </soapenv:Envelope>`
      }
    });
    licence = licence.preukazs.preukaz
    expiration = new Date(licence.platny_do)
    if(expiration > new Date())
      res.send({response: true})
    else
      res.send({response: false})
  })


  fastify.get('/checkRegistry', async(req, res) => {
    let id = req.query.id
    let registry = await doRequest({
      method: 'getByAttributeValue',
      body: {
        method: 'POST',
        url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106zaznam',
        headers: {
          'Content-Type': ['text/xml', 'application/xml']
        },
        body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106zaznam/types">
                 <soapenv:Header/>
                 <soapenv:Body>
                    <typ:getByAttributeValue>
                       <attribute_name>citatel_id</attribute_name>
                       <attribute_value>${id}</attribute_value>
                       <ids>
                          <id></id>
                       </ids>
                    </typ:getByAttributeValue>
                 </soapenv:Body>
              </soapenv:Envelope>`
      }
    })
    registry = registry.zaznams.zaznam
    if(registry === undefined){
      res.send({response: true})
      return
    }
    let expiration = new Date(registry.ukoncenie_podmienky)
    if(expiration > new Date()){
      res.send({response: false})
    }
    else
      res.send({response: true})
    //TODO: return boolean
  })

  fastify.post('/reservations/add', async(req, res) => {
    let insert = await doRequest({
        method: 'insert',
        body: {
          method: 'POST',
          url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106rezervacia',
          headers: {
            'Content-Type': ['text/xml', 'application/xml']
          },
          body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106rezervacia/types">
                   <soapenv:Header/>
                   <soapenv:Body>
                      <typ:insert>
                         <team_id>106</team_id>
                         <team_password>RDVKPF</team_password>
                         <rezervacia>
                            <id></id>
                            <name></name>
                            <vyhotovil></vyhotovil>
                            <citatel_id>${req.body.citatel_id}</citatel_id>
                            <exemplar_id>${req.body.exemplar_id}</exemplar_id>
                            <datum_vytvorenia>${req.body.datum_vytvorenia}</datum_vytvorenia>
                            <datum_vybavenia></datum_vybavenia>
                            <datum_od>${req.body.datum_od}</datum_od>
                            <datum_do>${req.body.datum_do}</datum_do>
                            <stav>Čaká na vybavenie</stav>
                            <popis>${req.body.popis}</popis>
                            <sprava_knihovnika></sprava_knihovnika>
                         </rezervacia>
                      </typ:insert>
                   </soapenv:Body>
                </soapenv:Envelope>`
        }
      })
    res.send(insert);
  })

fastify.get('/reservations/state', async(req, res) => {
  let q = req.query.q
  let query = await doRequest({
    method: 'getByAttributeValue',
    body: {
      method: 'POST',
      url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106rezervacia',
      headers: {
        'Content-Type': ['text/xml', 'application/xml']
      },
      body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106rezervacia/types">
               <soapenv:Header/>
               <soapenv:Body>
                  <typ:getByAttributeValue>
                     <attribute_name>stav</attribute_name>
                     <attribute_value>${q}</attribute_value>
                     <ids>
                        <id></id>
                     </ids>
                  </typ:getByAttributeValue>
               </soapenv:Body>
            </soapenv:Envelope>`
    }
  })
  query = query.rezervacias.rezervacia
  if(query === undefined)
    res.send({response: "Not available"})
  else
    res.send(query)
  })

// metoda vrati vsetky rezervacie citatela na zaklade citatel_id
  fastify.get('/reservations/customer_id', async(req, res) => {
    let id = req.query.id
    let query = await doRequest({
      method: 'getByAttributeValue',
      body: {
        method: 'POST',
        url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106rezervacia',
        headers: {
          'Content-Type': ['text/xml', 'application/xml']
        },
        body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106rezervacia/types">
                 <soapenv:Header/>
                 <soapenv:Body>
                    <typ:getByAttributeValue>
                       <attribute_name>citatel_id</attribute_name>
                       <attribute_value>${id}</attribute_value>
                       <ids>
                          <id></id>
                       </ids>
                    </typ:getByAttributeValue>
                 </soapenv:Body>
              </soapenv:Envelope>`
      }
    })
    query = query.rezervacias.rezervacia
    let _query = []
    if(query === undefined)
      res.send({response: "Not available"})
    else {
      for(let i in query)
        _query.push(query[i])
      _query = _query.filter((x) => {return x.stav !== "Zamietnutá" && x.stav !== "Zrušená"})
      res.send(_query)
    }
  })

//metoda vrati jednu konkretnu rezervaciu citatela na zaklade id rezervacie spolu s obrazkami
  fastify.get('/reservations/reservation', async(req, res) => {
    let id = req.query.id
    let reservation = await doRequest({
      method: 'getByAttributeValue',
      body: {
        method: 'POST',
        url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106rezervacia',
        headers: {
          'Content-Type': ['text/xml', 'application/xml']
        },
        body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106rezervacia/types">
                 <soapenv:Header/>
                 <soapenv:Body>
                    <typ:getByAttributeValue>
                       <attribute_name>id</attribute_name>
                       <attribute_value>${id}</attribute_value>
                       <ids>
                          <id></id>
                       </ids>
                    </typ:getByAttributeValue>
                 </soapenv:Body>
              </soapenv:Envelope>`
      }
    })
    reservation = reservation.rezervacias.rezervacia
    if(reservation === undefined) {
      res.send({response: "Not available"})
      return
    }
    let exemplar_id = reservation.exemplar_id;
    let exemplar = await doRequest({
      method: 'getByAttributeValue',
      body: {
        method: 'POST',
        url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106exemplar',
        headers: {
          'Content-Type': ['text/xml', 'application/xml']
        },
        body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106exemplar/types">
                 <soapenv:Header/>
                 <soapenv:Body>
                    <typ:getByAttributeValue>
                       <attribute_name>id</attribute_name>
                       <attribute_value>${exemplar_id}</attribute_value>
                       <ids>
                          <id></id>
                       </ids>
                    </typ:getByAttributeValue>
                 </soapenv:Body>
              </soapenv:Envelope>`
      }
    })
    exemplar = exemplar.exemplars.exemplar;
    if(exemplar === undefined) {
      res.send({response: "Not available"})
      return
    }
    let hra_id = exemplar.hra_id;
    let img = await doRequest({
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
    })
    img = img.obrazoks.obrazok;
    if(img === undefined) {
      res.send({response: "Not available"})
      return
    }
    reservation.obrazky = []
    for(let i in img)
      reservation.obrazky.push(img[i])
    res.send(reservation);
  })

//metoda na upravu rezervacie na zaklade jej id
// TODO: funguje ale treba doplnit "vyhotovil" a dalsie..
  fastify.patch('/reservations/edit', async(req, res) => {
    let update = await doRequest({
      method: 'update',
      body: {
        method: 'POST',
        url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106rezervacia',
        headers: {
          'Content-Type': ['text/xml', 'application/xml']
        },
        body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106rezervacia/types">
               <soapenv:Header/>
               <soapenv:Body>
                  <typ:update>
                     <team_id>106</team_id>
                     <team_password>RDVKPF</team_password>
                     <entity_id>${req.body.id}</entity_id>
                     <rezervacia>
                        <id></id>
                        <name></name>
                        <vyhotovil></vyhotovil>
                        <citatel_id>${req.body.citatel_id}</citatel_id>
                        <exemplar_id>${req.body.exemplar_id}</exemplar_id>
                        <datum_vytvorenia>${req.body.datum_vytvorenia}</datum_vytvorenia>
                        <datum_vybavenia>${req.body.datum_vybavenia}</datum_vybavenia>
                        <datum_od>${req.body.datum_od}</datum_od>
                        <datum_do>${req.body.datum_do}</datum_do>
                        <stav>${req.body.stav}</stav>
                        <popis>${req.body.popis}</popis>
                        <sprava_knihovnika>${req.body.sprava_knihovnika}</sprava_knihovnika>
                     </rezervacia>
                  </typ:update>
               </soapenv:Body>
            </soapenv:Envelope>`
      }
    })
    res.send(update)
  })

  fastify.get('/reservations/interval', async(req, res) => {
    let reservations = await doRequest({
      method: 'getByAttributeValue',
      body: {
        method: 'POST',
        url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106rezervacia',
        headers: {
          'Content-Type': ['text/xml', 'application/xml']
        },
        body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106rezervacia/types">
               <soapenv:Header/>
               <soapenv:Body>
                  <typ:getByAttributeValue>
                     <attribute_name>citatel_id</attribute_name>
                     <attribute_value>${req.query.id}</attribute_value>
                     <ids>
                        <id></id>
                     </ids>
                  </typ:getByAttributeValue>
               </soapenv:Body>
            </soapenv:Envelope>`
      }
    })
    reservations = reservations.rezervacias.rezervacia
    if(reservations === undefined) {
      res.send([])
      return
    }
    let _reservations = []
    for(let i in reservations)
      _reservations.push(reservations[i])
    let dateTo = new Date(req.query.dateTo)
    let dateFrom = new Date(req.query.dateFrom)
    _reservations = _reservations.filter((x) => { return x.stav !== "Zrušená" && x.stav !== "Zamietnutá" })
    reservations = []
    for(let i in _reservations) {
      if((dateFrom >= new Date(_reservations[i].datum_od) && dateFrom <= new Date(_reservations[i].datum_do)) || (dateTo >= new Date(_reservations[i].datum_od) && dateTo <= new Date(_reservations[i].datum_do)))
        reservations.push(_reservations[i])
    }
    res.send(reservations)
  })

  fastify.delete('/reservations/delete', async(req, res) => {
    let del = await doRequest({
        method: 'delete',
        body: {
          method: 'POST',
          url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106rezervacia',
          headers: {
            'Content-Type': ['text/xml', 'application/xml']
          },
          body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106rezervacia/types">
                 <soapenv:Header/>
                 <soapenv:Body>
                    <typ:delete>
                       <team_id>106</team_id>
                       <team_password>RDVKPF</team_password>
                       <entity_id>${req.body.id}</entity_id>
                    </typ:delete>
                 </soapenv:Body>
              </soapenv:Envelope>`
        }
    })
    res.code(200).send()
  })

  fastify.get('/user/forgotPassword', async(req, res) => {
    let email = req.query.email
    let user = await doRequest({
        method: 'getByAttributeValue',
        body: {
          method: 'POST',
          url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106citatel',
          headers: {
            'Content-Type': ['text/xml', 'application/xml']
          },
          body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106citatel/types">
                   <soapenv:Header/>
                   <soapenv:Body>
                      <typ:getByAttributeValue>
                         <attribute_name>email</attribute_name>
                         <attribute_value>${email}</attribute_value>
                         <ids>
                            <id></id>
                         </ids>
                      </typ:getByAttributeValue>
                   </soapenv:Body>
                </soapenv:Envelope>`
        }
    })
    user = user.citatels.citatel
    var code = gpc(6)
    let date = new Date()
    date.setMinutes(date.getMinutes() + 20);
    let update = await doRequest({
      method: 'update',
      body: {
        method: 'POST',
        url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106citatel',
        headers: {
          'Content-Type': ['text/xml', 'application/xml']
        },
        body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106citatel/types">
                 <soapenv:Header/>
                 <soapenv:Body>
                    <typ:update>
                       <team_id>106</team_id>
                       <team_password>RDVKPF</team_password>
                       <entity_id>${user.id}</entity_id>
                       <citatel>
                          <id>${user.id}</id>
                          <name>${user.name}</name>
                          <meno>${user.meno}</meno>
                          <priezvisko>${user.priezvisko}</priezvisko>
                          <email>${user.email}</email>
                          <heslo>${user.heslo}</heslo>
                          <telefon>${user.telefon}</telefon>
                          <pohlavie>${user.pohlavie}</pohlavie>
                          <datum_narodenia>${user.datum_narodenia}</datum_narodenia>
                          <cislo_preukazu>${user.cislo_preukazu}</cislo_preukazu>
                          <kod>${code}</kod>
                          <platnost_kodu>${date.toJSON()}</platnost_kodu>
                       </citatel>
                    </typ:update>
                 </soapenv:Body>
              </soapenv:Envelope>`
      }
    })
    let notify = await doRequest({
        method: 'notify',
        body: {
          method: 'POST',
          url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/NotificationServices/Email',
          headers: {
            'Content-Type': ['text/xml', 'application/xml']
          },
          body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/notificationservices/email/types">
                   <soapenv:Header/>
                   <soapenv:Body>
                      <typ:notify>
                         <team_id>106</team_id>
                         <password>RDVKPF</password>
                         <email>${user.email}</email>
                         <subject>Reset your password</subject>
                         <message>Hello ${user.meno}, reset your password by using the following code: ${code}</message>
                      </typ:notify>
                   </soapenv:Body>
                </soapenv:Envelope>`
        }
    })
    res.code(200).send()
  })


  fastify.get('/user/verifyCode', async(req, res) => {
    let email = req.query.email
    let code = req.query.code
    let user = await doRequest({
        method: 'getByAttributeValue',
        body: {
          method: 'POST',
          url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106citatel',
          headers: {
            'Content-Type': ['text/xml', 'application/xml']
          },
          body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106citatel/types">
                   <soapenv:Header/>
                   <soapenv:Body>
                      <typ:getByAttributeValue>
                         <attribute_name>email</attribute_name>
                         <attribute_value>${email}</attribute_value>
                         <ids>
                            <id></id>
                         </ids>
                      </typ:getByAttributeValue>
                   </soapenv:Body>
                </soapenv:Envelope>`
        }
    })
    user = user.citatels.citatel
    if(user.kod === parseInt(code) && new Date() <= new Date(user.platnost_kodu))
      res.send({response: true})
    else
      res.send({response: false})
  })

  fastify.post('/user/password', async(req, res) => {
    let email = req.body.email
    let password = req.body.heslo
    let user = await doRequest({
        method: 'getByAttributeValue',
        body: {
          method: 'POST',
          url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106citatel',
          headers: {
            'Content-Type': ['text/xml', 'application/xml']
          },
          body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106citatel/types">
                   <soapenv:Header/>
                   <soapenv:Body>
                      <typ:getByAttributeValue>
                         <attribute_name>email</attribute_name>
                         <attribute_value>${email}</attribute_value>
                         <ids>
                            <id></id>
                         </ids>
                      </typ:getByAttributeValue>
                   </soapenv:Body>
                </soapenv:Envelope>`
        }
    })
    user = user.citatels.citatel
    let update = await doRequest({
      method: 'update',
      body: {
        method: 'POST',
        url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/Students/Team106citatel',
        headers: {
          'Content-Type': ['text/xml', 'application/xml']
        },
        body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/students/team106citatel/types">
                 <soapenv:Header/>
                 <soapenv:Body>
                    <typ:update>
                       <team_id>106</team_id>
                       <team_password>RDVKPF</team_password>
                       <entity_id>${user.id}</entity_id>
                       <citatel>
                          <id>${user.id}</id>
                          <name>${user.name}</name>
                          <meno>${user.meno}</meno>
                          <priezvisko>${user.priezvisko}</priezvisko>
                          <email>${user.email}</email>
                          <heslo>${password}</heslo>
                          <telefon>${user.telefon}</telefon>
                          <pohlavie>${user.pohlavie}</pohlavie>
                          <datum_narodenia>${user.datum_narodenia}</datum_narodenia>
                          <cislo_preukazu>${user.cislo_preukazu}</cislo_preukazu>
                          <kod></kod>
                          <platnost_kodu></platnost_kodu>
                       </citatel>
                    </typ:update>
                 </soapenv:Body>
              </soapenv:Envelope>`
      }
    })
    res.code(200).send()
  })


  fastify.post('/notify', async(req, res) => {
    let nofity = await doRequest({
        method: 'notify',
        body: {
          method: 'POST',
          url: 'http://pis.predmety.fiit.stuba.sk/pis/ws/NotificationServices/Email',
          headers: {
            'Content-Type': ['text/xml', 'application/xml']
          },
          body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:typ="http://pis.predmety.fiit.stuba.sk/pis/notificationservices/email/types">
                 <soapenv:Header/>
                 <soapenv:Body>
                    <typ:notify>
                       <team_id>106</team_id>
                       <password>RDVKPF</password>
                       <email>${req.body.email}</email>
                       <subject>${req.body.subject}</subject>
                       <message>${req.body.message}</message>
                    </typ:notify>
                 </soapenv:Body>
              </soapenv:Envelope>`
        }
    })
  })
}


module.exports = routes
