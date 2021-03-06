const express = require("express");
const bodyParser = require('body-parser');
const mysql = require('mysql');
const app = express();
const util = require('util');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const configuration = {
  host: "localhost",
  user: "root",
  password: "",
  database: "mychemis_algebrae_v01"
};

var con = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "mychemis_algebrae_v01"
});

const cifrado = {};
const aesjs = require('aes-js');
const key_128 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

function cifrar(texto) {
  let texto_bytes = aesjs.utils.utf8.toBytes(texto);
  //El contador es optional, si se omite, comienza desde el 1
  let aesCtr = new aesjs.ModeOfOperation.ctr(key_128, new aesjs.Counter(5));
  let encryptedBytes = aesCtr.encrypt(texto_bytes);
  let encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
  return encryptedHex;
}

function decifrar(encryptedHex) {
  let encryptedBytes = aesjs.utils.hex.toBytes(encryptedHex);
  //El contador es optional, si se omite, comienza desde el 1
  let aesCtr = new aesjs.ModeOfOperation.ctr(key_128, new aesjs.Counter(5));
  let decryptedBytes = aesCtr.decrypt(encryptedBytes);
  let decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
  return decryptedText;
}


//'/usuarios/:id const id = req.params.id;  
app.get('/rest/login', function (req, res) {
  console.log("Request Api rest: /login");
  console.log(new Date());
  if (req.query.user == undefined || req.query.pass == undefined || req.query.user == '' || req.query.pass == '') {
    respuesta = { error: true, codigo: 400, mensaje: 'Missing or Invalid Parameters.' };
    res.send(respuesta);
  } else {
    con.getConnection(function (err, connection) {
      if (err) {
        connection.release();
        console.log(err);
        respuesta = { error: true, codigo: 400, mensaje: 'Error while connecting to the database. ' + err };
        res.send(respuesta);
      } else {
        sql = "select * from musuario where cor_usu='" + String(req.query.user) + "' and pas_usu='" + cifrar(String(req.query.pass)) + "';";
        connection.query(sql, function (err, result) {
          if (err) {
            connection.release();
            respuesta = { error: true, codigo: 400, mensaje: 'Error while retrieving data. ' + err };
            res.send(respuesta);
          } else {
            let x = 0;
            respuesta = {};
            try {
              respuesta = {
                error: false, codigo: 200,
                mensaje: 'User Found.',
                Correo: result[0].cor_usu,
                Tipo: result[0].id_tus,
                Nombre: result[0].nom_usu,
                Curp: result[0].curp_usu,
                Token: decifrar(String(result[0].tok_usu))
              };
              x = 1;
            } catch (error) {
              //console.log(error);
            }
            if (x == 0) {
              respuesta = {
                error: true, codigo: 400,
                mensaje: 'User Not Found.',
              };
            }
            connection.release();
            res.send(respuesta);
          }
        });
      }
    });
  }
});

app.get('/rest/consultaAGProfesor', function (req, res) {
  console.log("Request Api rest: /consultaAGProfesor");
  console.log(new Date());
  if (req.query.tok == undefined || req.query.tok == '') {
    respuesta = { error: true, codigo: 400, mensaje: 'Missing or Invalid Parameters.' };
    res.send(respuesta);
  } else {
    con.getConnection(function (err, connection) {
      if (err) {
        connection.release();
        console.log(err);
        respuesta = { error: true, codigo: 400, mensaje: 'Error while connecting to the database. ' + err };
        res.send(respuesta);
      } else {
        sql = "select * from musuario where tok_usu='" + cifrar(String(req.query.tok)) + "';";
        connection.query(sql, async (err, result) => {
          if (err) {
            connection.release();
            console.log(err)
            respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the token.' };
            res.send(respuesta);
          } else {
            try {
              result[0].tok_usu;
              if ((await getTipoUsuarioID(result[0].id_usu) == 3)) {
                const dat = await getAlumnosGrupoProfe(result[0].id_usu);
                if (dat == 'error') {
                  respuesta = { error: true, codigo: 400, mensaje: 'Error while searching data.' };
                  connection.release();
                  res.send(respuesta);
                } else {
                  connection.release();
                  respuesta = { error: false, codigo: 200, mensaje: 'token accepted.', alumnos: dat };
                  res.send(respuesta);
                }
              } else {
                respuesta = { error: true, codigo: 400, mensaje: 'Invalid User type.' };
                connection.release();
                res.send(respuesta);
              }
            } catch (error) {
              console.log(error);
              connection.release();
              respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the token.' };
              res.send(respuesta);
            }
          }
        });
      }
    });
  }
});

app.get('/rest/consultaAlumnosGrupos', function (req, res) {
  console.log("Request Api rest: /consultaAlumnosGrupos");
  console.log(new Date());
  if (req.query.tok == undefined || req.query.tok == '') {
    respuesta = { error: true, codigo: 400, mensaje: 'Missing or Invalid Parameters.' };
    res.send(respuesta);
  } else {
    con.getConnection(function (err, connection) {
      if (err) {
        connection.release();
        console.log(err);
        respuesta = { error: true, codigo: 400, mensaje: 'Error while connecting to the database. ' + err };
        res.send(respuesta);
      } else {
        sql = "select * from musuario where tok_usu='" + cifrar(String(req.query.tok)) + "';";
        connection.query(sql, async (err, result) => {
          if (err) {
            connection.release();
            console.log(err)
            respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the token.' };
            res.send(respuesta);
          } else {
            try {
              result[0].tok_usu;
              var iduser = await getTipoUsuarioID(result[0].id_usu);
              if (iduser == 1 || iduser == 2 || iduser == 'err') {
                respuesta = { error: true, codigo: 400, mensaje: 'Invalid User type.' };
                connection.release();
                res.send(respuesta);
              } else {
                var alumnosGrupo = [];
                var idgrupos = await getIdsGrupos();
                if (idgrupos == 'err') {
                  respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the data.' };
                  connection.release();
                  res.send(respuesta);
                } else {
                  for (var i = 0; i < idgrupos.length; i++) {
                    alumnos = await getAlumnosIdGrupo(idgrupos[i]);
                    if (alumnos == 'err') {
                      alumnosGrupo.push([[], '', idgrupos[i]]);
                    } else {
                      alumnosGrupo.push([alumnos, idgrupos[i], await getNomGrupoId(idgrupos[i])]);
                    }
                  }
                  respuesta = { error: false, codigo: 200, mensaje: 'token accepted.', alumnosGrupo: alumnosGrupo };
                  connection.release();
                  res.send(respuesta);
                }
              }
            } catch (error) {
              console.log(error);
              connection.release();
              respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the token.' };
              res.send(respuesta);
            }
          }
        });
      }
    });
  }
});

app.get('/rest/consultaCuestionarioProfesor', function (req, res) {
  console.log("Request Api rest: /consultaCuestionarioProfesor");
  console.log(new Date());
  if (req.query.tok == undefined || req.query.tok == '') {
    respuesta = { error: true, codigo: 400, mensaje: 'Missing or Invalid Parameters.' };
    res.send(respuesta);
  } else {
    con.getConnection(function (err, connection) {
      if (err) {
        connection.release();
        console.log(err);
        respuesta = { error: true, codigo: 400, mensaje: 'Error while connecting to the database. ' + err };
        res.send(respuesta);
      } else {
        sql = "select * from musuario where tok_usu='" + cifrar(String(req.query.tok)) + "';";
        connection.query(sql, async (err, result) => {
          if (err) {
            connection.release();
            console.log(err)
            respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the token.' };
            res.send(respuesta);
          } else {
            try {
              result[0].tok_usu;
              if ((await getTipoUsuarioID(result[0].id_usu) == 3)) {
                var idGrupos = await getGruposIdProfe(result[0].id_usu);
                if (idGrupos == 'err') {
                  respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the data.' };
                  res.send(respuesta);
                } else {
                  var cuestionarios = await getCuestionariosProfe(idGrupos);
                  if (cuestionarios == 'err') {
                    respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the data.' };
                    res.send(respuesta);
                  } else {
                    respuesta = { error: false, codigo: 200, mensaje: 'token accepted.', cuestionarios: cuestionarios };
                    connection.release();
                    res.send(respuesta);
                  }
                }
              } else {
                connection.release();
                respuesta = { error: true, codigo: 400, mensaje: 'Invalid User type.' };
                res.send(respuesta);
              }
            } catch (error) {
              console.log(error);
              connection.release();
              respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the token.' };
              res.send(respuesta);
            }
          }
        });
      }
    });
  }
});

app.get('/rest/consultaCuestionarios', function (req, res) {
  console.log("Request Api rest: /consultaCuestionarios");
  console.log(new Date());
  if (req.query.tok == undefined || req.query.tok == '') {
    respuesta = { error: true, codigo: 400, mensaje: 'Missing or Invalid Parameters.' };
    res.send(respuesta);
  } else {
    con.getConnection(function (err, connection) {
      if (err) {
        connection.release();
        console.log(err);
        respuesta = { error: true, codigo: 400, mensaje: 'Error while connecting to the database. ' + err };
        res.send(respuesta);
      } else {
        sql = "select * from musuario where tok_usu='" + cifrar(String(req.query.tok)) + "';";
        connection.query(sql, async (err, result) => {
          if (err) {
            connection.release();
            console.log(err)
            respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the token.' };
            res.send(respuesta);
          } else {
            try {
              result[0].tok_usu;
              var iduser = await getTipoUsuarioID(result[0].id_usu);
              if (iduser == 1 || iduser == 2 || iduser == 'err') {
                connection.release();
                respuesta = { error: true, codigo: 400, mensaje: 'Invalid User type.' };
                res.send(respuesta);
              } else {
                var cuestionarios = await getCuestionarios();
                if (cuestionarios == 'err') {
                  connection.release();
                  respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the data.' };
                  res.send(respuesta);
                } else {
                  respuesta = { error: false, codigo: 200, mensaje: 'token accepted.', cuestionarios: cuestionarios };
                  connection.release();
                  res.send(respuesta);
                }
              }
            } catch (error) {
              console.log(error);
              connection.release();
              respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the token.' };
              res.send(respuesta);
            }
          }
        });
      }
    });
  }
});

app.get('/rest/consultaCuestPreguntas', function (req, res) {
  console.log("Request Api rest: /consultaCuestPreguntas");
  console.log(new Date());
  if (req.query.tok == undefined || req.query.tok == '' || req.query.cues == undefined || req.query.cues == '') {
    respuesta = { error: true, codigo: 400, mensaje: 'Missing or Invalid Parameters.' };
    res.send(respuesta);
  } else {
    con.getConnection(function (err, connection) {
      if (err) {
        connection.release();
        console.log(err);
        respuesta = { error: true, codigo: 400, mensaje: 'Error while connecting to the database. ' + err };
        res.send(respuesta);
      } else {
        sql = "select * from musuario where tok_usu='" + cifrar(String(req.query.tok)) + "';";
        connection.query(sql, async (err, result) => {
          if (err) {
            connection.release();
            console.log(err)
            respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the token.' };
            res.send(respuesta);
          } else {
            try {
              result[0].tok_usu;
              var iduser = await getTipoUsuarioID(result[0].id_usu);
              if (iduser == 1 || iduser == 2 || iduser == 'err') {
                connection.release();
                respuesta = { error: true, codigo: 400, mensaje: 'Invalid User type.' };
                res.send(respuesta);
              } else {
                var cuestionarios = await getPreguntasIdCue(req.query.cues);
                if (cuestionarios == 'err') {
                  connection.release();
                  respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the data.' };
                  res.send(respuesta);
                } else {
                  respuesta = { error: false, codigo: 200, mensaje: 'token accepted.', cuestionario: cuestionarios };
                  connection.release();
                  res.send(respuesta);
                }
              }
            } catch (error) {
              console.log(error);
              connection.release();
              respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the token.' };
              res.send(respuesta);
            }
          }
        });
      }
    });
  }
});

app.get('/rest/consultaCuestAprRpr', function (req, res) {
  console.log("Request Api rest: /consultaCuestAprRpr");
  console.log(new Date());
  if (req.query.tok == undefined || req.query.tok == '' || req.query.cues == undefined || req.query.cues == '') {
    respuesta = { error: true, codigo: 400, mensaje: 'Missing or Invalid Parameters.' };
    res.send(respuesta);
  } else {
    con.getConnection(function (err, connection) {
      if (err) {
        connection.release();
        console.log(err);
        respuesta = { error: true, codigo: 400, mensaje: 'Error while connecting to the database. ' + err };
        res.send(respuesta);
      } else {
        sql = "select * from musuario where tok_usu='" + cifrar(String(req.query.tok)) + "';";
        connection.query(sql, async (err, result) => {
          if (err) {
            connection.release();
            console.log(err)
            respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the token.' };
            res.send(respuesta);
          } else {
            try {
              result[0].tok_usu;
              var iduser = await getTipoUsuarioID(result[0].id_usu);
              if (iduser == 1 || iduser == 2 || iduser == 'err') {
                connection.release();
                respuesta = { error: true, codigo: 400, mensaje: 'Invalid User type.' };
                res.send(respuesta);
              } else {
                var cuestionarios = await getCueAprRpr(req.query.cues);
                if (cuestionarios == 'err') {
                  connection.release();
                  respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the data.' };
                  res.send(respuesta);
                } else {
                  respuesta = { error: false, codigo: 200, mensaje: 'token accepted.', aprrpr: cuestionarios };
                  connection.release();
                  res.send(respuesta);
                }
              }
            } catch (error) {
              console.log(error);
              connection.release();
              respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the token.' };
              res.send(respuesta);
            }
          }
        });
      }
    });
  }
});

app.get('/rest/consultaCuestionarioAlumno', function (req, res) {
  console.log("Request Api rest: /consultaCuestionarioAlumno");
  console.log(new Date());
  if (req.query.tok == undefined || req.query.tok == '') {
    respuesta = { error: true, codigo: 400, mensaje: 'Missing or Invalid Parameters.' };
    res.send(respuesta);
  } else {
    con.getConnection(function (err, connection) {
      if (err) {
        connection.release();
        console.log(err);
        respuesta = { error: true, codigo: 400, mensaje: 'Error while connecting to the database. ' + err };
        res.send(respuesta);
      } else {
        sql = "select * from musuario where tok_usu='" + cifrar(String(req.query.tok)) + "';";
        connection.query(sql, async (err, result) => {
          if (err) {
            connection.release();
            console.log(err)
            respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the token.' };
            res.send(respuesta);
          } else {
            try {
              result[0].tok_usu;
              if ((await getTipoUsuarioID(result[0].id_usu) == 1)) {
                var idGrupos = await getGruposIdAlu(result[0].id_usu);
                if (idGrupos == 'err') {
                  connection.release();
                  respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the data.' };
                  res.send(respuesta);
                } else {
                  var cuestionarios = await getCuestionariosProfe(idGrupos);
                  if (cuestionarios == 'err') {
                    connection.release();
                    respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the data.' };
                    res.send(respuesta);
                  } else {
                    respuesta = { error: false, codigo: 200, mensaje: 'token accepted.', cuestionarios: cuestionarios };
                    connection.release();
                    res.send(respuesta);
                  }
                }
              } else {
                respuesta = { error: true, codigo: 400, mensaje: 'Invalid User type.' };
                connection.release();
                res.send(respuesta);
              }
            } catch (error) {
              console.log(error);
              connection.release();
              respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the token.' };
              res.send(respuesta);
            }
          }
        });
      }
    });
  }
});

app.post('/rest/responderCuestionarioAlumno', function (req, res) {
  console.log("Request Api rest: /responderCuestionarioAlumno");
  console.log(new Date());
  if (req.query.tok == undefined || req.query.tok == '') {
    respuesta = { error: true, codigo: 400, mensaje: 'Missing or Invalid Parameters.' };
    res.send(respuesta);
  } else {
    con.getConnection(function (err, connection) {
      if (err) {
        connection.release();
        console.log(err);
        respuesta = { error: true, codigo: 400, mensaje: 'Error while connecting to the database. ' + err };
        res.send(respuesta);
      } else {
        sql = "select * from musuario where tok_usu='" + cifrar(String(req.query.tok)) + "';";
        connection.query(sql, async (err, result) => {
          if (err) {
            connection.release();
            console.log(err)
            respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the token.' };
            res.send(respuesta);
          } else {
            try {
              result[0].tok_usu;
              if ((await getTipoUsuarioID(result[0].id_usu) == 1)) {
                var idGrupos = await getGruposIdAlu(result[0].id_usu);
                if (idGrupos == 'err') {
                  connection.release();
                  respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the data.' };
                  res.send(respuesta);
                } else {
                  var cuestionarios = await getCuestionariosProfe(idGrupos);
                  if (cuestionarios == 'err') {
                    connection.release();
                    respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the data.' };
                    res.send(respuesta);
                  } else {
                    var cuestionarioAresponder = []
                    for (var x = 0; x < cuestionarios.length; x++) {
                      if (String(cuestionarios[x][0]) == req.body.cuestionario) {
                        cuestionarioAresponder = cuestionarios[x];
                      }
                    }
                    if (cuestionarioAresponder.length == 0) {
                      respuesta = { error: true, codigo: 400, mensaje: 'Error, the user has no access to the requested test.' };
                      connection.release();
                      res.send(respuesta);
                    } else {
                      if (await checkCuestAlumno(cuestionarioAresponder[0], result[0].id_usu) == '') {
                        var preguntasCue = await getPreguntasIdCue(cuestionarioAresponder[0]);
                        var resCorrectas = [];
                        var resIncorrectas = [];
                        for (var y = 0; y < preguntasCue.length; y++) {
                          if (String(preguntasCue[y][0]) == String(req.body.Preguntas[y][0])) {
                            if (String(preguntasCue[y][1]) == String(req.body.Preguntas[y][1])) {
                              resCorrectas.push(await getIdPregunta(preguntasCue[y][0]));
                            } else {
                              resIncorrectas.push(await getIdPregunta(preguntasCue[y][0]));
                            }
                          } else {
                            resIncorrectas.push(await getIdPregunta(preguntasCue[y][0]));
                          }
                        }
                        var estatus = await saveRespuestasAlumno(cuestionarioAresponder[0], result[0].id_usu, resCorrectas, resIncorrectas);
                        if (estatus == 'error') {
                          respuesta = { error: true, codigo: 400, mensaje: 'Error while saving the results.' };
                          connection.release();
                          res.send(respuesta);
                        } else {
                          respuesta = { error: false, codigo: 200, mensaje: 'token accepted and test grades and uploaded.' };
                          connection.release();
                          res.send(respuesta);
                        }
                      } else {
                        respuesta = { error: true, codigo: 400, mensaje: 'Error, el cuestionario ya se ha respondido anteriormente por lo que no se puede volver a contestar.' };
                        connection.release();
                        res.send(respuesta);
                      }
                    }
                  }
                }
              } else {
                respuesta = { error: true, codigo: 400, mensaje: 'Invalid User type.' };
                connection.release();
                res.send(respuesta);
              }
            } catch (error) {
              console.log(error);
              connection.release();
              respuesta = { error: true, codigo: 400, mensaje: 'Error while searching the token.' };
              res.send(respuesta);
            }
          }
        });
      }
    });
  }
});

function createDb(config) {
  const connection = mysql.createConnection(config);
  return {
    query(sql, args) { return util.promisify(connection.query).call(connection, sql, args); },
    close() { return util.promisify(connection.end).call(connection); }
  };
}

var saveRespuestasAlumno = async (idCue, idALu, resCor, resInc) => {
  try {
    sql = "insert into dpuntajealumnocuestionario (id_usu,id_cue,id_pco,id_pin) values(" + idALu + "," + idCue + ",'" + String(resCor) + "','" + String(resInc) + "');";
    console.log(sql);
    const connection = createDb(configuration);
    const status = await connection.query(sql);
    connection.close();
    return status;
  } catch (eror) {
    console.log(eror);
    connection.close();
    return 'error';
  }
}

var getCueAprRpr = async (idCue) => {
  sql = "select * from dpuntajealumnocuestionario where id_cue = " + String(idCue) + ";";
  try {
    const connection = createDb(configuration);
    const data = await connection.query(sql);
    aprobados = 0;
    reprobados = 0;
    for (var x = 0; x < data.length; x++) {
      var splitCor = String(data[x].id_pco);
      var splitIn = String(data[x].id_pin);
      var total = splitCor.length + splitIn.length;
      var cal = (splitCor.length / total) * 100
      if (cal > 60) {
        aprobados++;
      } else {
        reprobados++;
      }
    }
    connection.close();
    return [aprobados, reprobados];
  } catch (eror) {
    console.log(eror);
    connection.close();
    return 'error';
  }
}

var getTemaId = async (idtem) => {
  try {
    sql = "select * from ctemas where id_tem = " + String(idtem) + ";";
    const connection = createDb(configuration);
    const data = await connection.query(sql);
    connection.close();
    return data[0].nom_tem;
  } catch (eror) {
    console.log(eror);
    connection.close();
    return 'err';
  }
}

var getPreguntaId = async (idPre) => {
  try {
    sql = "select * from mbancopreguntas where id_bpr = " + String(idPre) + ";";
    const connection = createDb(configuration);
    const data = await connection.query(sql);
    connection.close();
    return [data[0].con_pre, data[0].res_cor, await getTemaId(data[0].id_tem), data[0].opc_a, data[0].opc_b, data[0].opc_a, data[0].opc_d, data[0].id_dif];
  } catch (eror) {
    console.log(eror);
    connection.close();
    return 'err';
  }
}

var getIdPregunta = async (nomPre) => {
  try {
    sql = "select * from mbancopreguntas where con_pre = '" + String(nomPre) + "';";
    const connection = createDb(configuration);
    const data = await connection.query(sql);
    connection.close();
    return data[0].id_bpr;
  } catch (eror) {
    console.log(eror);
    connection.close();
    return 'err';
  }
}

var getPreguntasIdCue = async (idCue) => {
  try {
    preguntas = []
    sql = "select * from ecuestionario where id_cue = " + String(idCue) + ";";
    const connection = createDb(configuration);
    const data = await connection.query(sql);
    var split = String(data[0].id_bpr).split(',');
    for (var x = 0; x < split.length; x++) {
      var pregunta = await getPreguntaId(split[x]);
      if (pregunta != 'err') {
        preguntas.push(pregunta);
      }
    }
    connection.close();
    return preguntas;
  } catch (eror) {
    console.log(eror);
    connection.close();
    return 'err';
  }
}

var checkCuestAlumno = async (idCue, idALu) => {
  try {
    sql = "select * from dpuntajealumnocuestionario where id_cue = " + String(idCue) + " and id_usu=" + String(idALu) + ";";
    const connection = createDb(configuration);
    const data = await connection.query(sql);
    connection.close();
    return data[0].id_pac;
  } catch (eror) {
    console.log(eror);
    connection.close();
    return 'err';
  }
}

var getGruposIdProfe = async (idProfe) => {
  try {
    sql = "select * from eusuariosgrupo where id_usu=" + String(idProfe) + ";";
    const connection = createDb(configuration);
    const data = await connection.query(sql);
    grupos = [];
    for (var x = 0; x < data.length; x++) {
      grupos.push(data[x].id_gru);
    }
    connection.close();
    return grupos;
  } catch (eror) {
    console.log(eror);
    connection.close();
    return 'err';
  }
}

var getGruposIdAlu = async (idALu) => {
  try {
    sql = "select * from eusuariosgrupo where id_usu=" + String(idALu) + ";";
    const connection = createDb(configuration);
    const data = await connection.query(sql);
    grupos = [];
    for (var x = 0; x < data.length; x++) {
      grupos.push(data[x].id_gru);
    }
    connection.close();
    return grupos;
  } catch (eror) {
    console.log(eror);
    connection.close();
    return 'err';
  }
}

var getCuestionariosProfe = async (idGruposProf) => {
  try {
    sql = "select * from ecuestionario;";
    const connection = createDb(configuration);
    const data = await connection.query(sql);
    cuestionarios = [];
    for (var x = 0; x < data.length; x++) {
      var split = String(data[x].id_gru).split(',');
      for (var contS = 0; contS < split.length; contS++) {
        if (idGruposProf.includes(parseInt(split[contS]))) {
          cuestionarios.push([data[x].id_cue, data[x].nom_cue, data[x].fec_ini, data[x].fec_fin, split[contS]]);
        }
      }
    }
    connection.close();
    return cuestionarios;
  } catch (eror) {
    console.log(eror);
    connection.close();
    return 'err';
  }
}

var getCuestionarios = async () => {
  try {
    sql = "select * from ecuestionario;";
    const connection = createDb(configuration);
    const data = await connection.query(sql);
    cuestionarios = [];
    for (var x = 0; x < data.length; x++) {
      var split = String(data[x].id_gru).split(',');
      for (var contS = 0; contS < split.length; contS++) {
        cuestionarios.push([data[x].id_cue, data[x].nom_cue, data[x].fec_ini, data[x].fec_fin, split[contS]]);
      }
    }
    connection.close();
    return cuestionarios;
  } catch (eror) {
    console.log(eror);
    connection.close();
    return 'err';
  }
}

var getAlumnosIdGruProf = async (idProfe, idGru) => {
  try {
    sql = "select * from eusuariosgrupo where id_gru='" + String(idGru) + "';";
    const connection = createDb(configuration);
    try {
      var AlumnosIDG = await connection.query(sql);
      var alu = [];
      for (var contGrups = 0; contGrups < AlumnosIDG.length; contGrups++) {
        if (AlumnosIDG[contGrups].id_usu != idProfe) {
          alumno = await getAlumnoId(AlumnosIDG[contGrups].id_usu);
          if (alumno == 'err') {
            alu.push([]);
          } else {
            alu.push(alumno);
          }
        }
        if ((contGrups + 1) == AlumnosIDG.length) {
          connection.close();
          return alu;
        }
      }
    } catch (err) {
      connection.close();
      console.log(err);
      return 'err';
    }
  } catch (err) {
    console.log(err);
    return 'err';
  }
}

var getTipoUsuarioID = async (id) => {
  try {
    sql = "select * from musuario where id_usu='" + String(id) + "';";
    const connection = createDb(configuration);
    try {
      var usuario = await connection.query(sql);
      connection.close();
      return usuario[0].id_tus;
    }
    catch (err) {
      connection.close();
      console.log(err);
      return 'err';
    }
  } catch (err) {
    console.log(err);
    return 'err';
  }
}

var getIdsGrupos = async () => {
  try {
    sql = "select * from eusuariosgrupo;";
    const connection = createDb(configuration);
    try {
      var resultado = await connection.query(sql);
      var grupos = [];
      for (var contGrups = 0; contGrups < resultado.length; contGrups++) {
        if (!grupos.includes(resultado[contGrups].id_gru)) {
          grupos.push(resultado[contGrups].id_gru);
        }
        if ((contGrups + 1) == resultado.length) {
          connection.close();
          return grupos;
        }
      }
    } catch (err) {
      connection.close();
      console.log(err);
      return 'err';
    }
  } catch (err) {
    console.log(err);
    return 'err';
  }
}

var getAlumnosIdGrupo = async (idGru) => {
  try {
    sql = "select * from eusuariosgrupo where id_gru='" + String(idGru) + "';";
    const connection = createDb(configuration);
    try {
      var AlumnosIDG = await connection.query(sql);
      var alu = [];
      for (var contGrups = 0; contGrups < AlumnosIDG.length; contGrups++) {
        if (await getTipoUsuarioID(AlumnosIDG[contGrups].id_usu) == 1) {
          alumno = await getAlumnoId(AlumnosIDG[contGrups].id_usu);
          if (alumno == 'err') {
            alu.push([]);
          } else {
            alu.push(alumno);
          }
        }
        if ((contGrups + 1) == AlumnosIDG.length) {
          connection.close();
          return alu;
        }
      }
    } catch (err) {
      connection.close();
      console.log(err);
      return 'err';
    }
  } catch (err) {
    console.log(err);
    return 'err';
  }
}

let getAlumnosGrupoProfe = async function (idProfe) {
  var dictGroupAlu = [];
  const connection = createDb(configuration);
  sql = "select * from eusuariosgrupo where id_usu='" + String(idProfe) + "';"
  var result = await connection.query(sql);
  try {
    var grupos = [];
    for (var i = 0; i < result.length; i++) {
      grupos.push(result[i].id_gru);
    }
    for (var cont = 0; cont < grupos.length; cont++) {
      var grup = grupos[cont];
      const alumnos = await getAlumnosIdGruProf(idProfe, grup);
      dictGroupAlu.push([alumnos, grup, await getNomGrupoId(grup)]);
    }
    return dictGroupAlu;
  } catch (error) {
    console.log(error);
    return 'err-no hay alumnos';
  }
}

let getNomGrupoId = async (idGru) => {
  try {
    sql = "select * from cgrupo where id_gru = " + String(idGru) + ";";
    const connection = createDb(configuration);
    const data = await connection.query(sql);
    connection.close();
    return data[0].nom_gru;
  } catch (eror) {
    console.log(eror);
    connection.close();
    return 'err';
  }
}

let getAlumnoId = async (idALu) => {
  try {
    sql = "select * from musuario where id_usu = " + String(idALu) + ";";
    const connection = createDb(configuration);
    const data = await connection.query(sql);
    alumno = [data[0].nom_usu, data[0].cor_usu];
    connection.close();
    return alumno;
  } catch (eror) {
    console.log(eror);
    connection.close();
    return 'err';
  }
}

app.use(function (req, res, next) {
  respuesta = {
    error: true,
    codigo: 404,
    mensaje: 'URL no encontrada'
  };
  res.status(404).send(respuesta);
});

app.listen(3000, () => {
  console.log("El servidor está inicializado en el puerto 3000");
});
