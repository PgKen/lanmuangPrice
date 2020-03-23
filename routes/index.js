var express = require('express');
var router = express.Router();

var mysql = require('mysql');

var moment = require('moment')

let db_product = {
  host: 'localhost',
  user: 'root',
  password: 'comp@113',
  database: 'db_product'
}

var conn;
const letActive = 1 // สำหรับค่า Active

// start Mysql Connect
function handleDisconnect() {
  conn = mysql.createConnection(db_product); // Recreate the connection, since
  // the old one cannot be reused.
  conn.connect(function (err) { // The server is either down
    if (err) { // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    } // to avoid a hot loop, and to allow our node script to
  }); // process asynchronous requests in the meantime.
  // If you're also serving http, display a 503 error.
  conn.on('error', function (err) {
    console.log('db error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect(); // lost due to either server restart, or a
    } else { // connnection idle timeout (the wait_timeout
      throw err; // server variable configures this)
    }
  });
}
handleDisconnect();
/**** End Data Service */

// sql
// รายการประเภท
const consListType = "SELECT * FROM producttype WHERE active = 1 ORDER BY id"
const dateNow = moment().format('YYYY-MM-DD');
// show price
let consShowPrice = "SELECT *,productprice.id As idData FROM productprice "
consShowPrice += "INNER JOIN product ON productprice.idProduct = product.id "
consShowPrice += "INNER JOIN productkind ON product.id_kind = productkind.id "
consShowPrice += "INNER JOIN producttype ON productkind.id_type = producttype.id "
consShowPrice += "INNER JOIN productunit ON productprice.idUnit = productunit.id "
consShowPrice += "INNER JOIN locate ON productprice.idLocate = locate.id "
consShowPrice += "WHERE productprice.active = 1 AND producttype.id = ? "
consShowPrice += "AND productprice.datePrice = ?"
// end show price
// end sql

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Express'
  });
});

// ประเภทสินค้า
router.get('/type', (req, res) => {
  let dataType = []
  async function main() {
    await selectDataType()
  }

  function selectDataType() {
    let sql = "SELECT * FROM producttype WHERE active = 1 ORDER BY id"
    conn.query(sql, (err, resPro) => {
      dataType = resPro
      sendData()
    })
  }

  function sendData() {
    // console.log(dataType);
    res.render('type', {
      title: "ประเภท",
      dataType
    })
  }
  main()
})

// เพิ่มประเภทสินค้า
router.post('/addType', (req, res) => {
  let dataType = req.body.nameType
  console.log(dataType);
  let sql = "INSERT INTO producttype(typeName,active) VALUES(?,?)"
  conn.query(sql, [dataType, letActive], (err, resPro) => {
    if (err) throw console.log(err);
    res.redirect('../type')
  })
})
// End เพิ่มประเภทสินค้า

// ลบสินค้า
router.get('/delType/:id', (req, res) => {
  let id = req.params.id
  let sql = "DELETE FROM producttype WHERE id = ?"
  conn.query(sql, [id], (err, resPro) => {
    if (err) throw console.log(err);
    res.redirect('../type')
  })
})
// End ลบสินค้า

// ลบสินค้า
router.get('/delKind/:id', (req, res) => {
  let id = req.params.id
  let sql = "DELETE FROM productkind WHERE id = ?"
  conn.query(sql, [id], (err, resPro) => {
    if (err) throw console.log(err);
    res.redirect('../kind')
  })
})
// End ลบสินค้า


// ชนิด kind
router.get('/kind', (req, res) => {

  let dataType = []

  async function main() {
    await selectDataType()
  }

  function selectDataType() {
    let sql = "SELECT * FROM producttype WHERE active = 1 ORDER BY id"
    conn.query(sql, (err, resPro) => {
      dataType = resPro
      listKind()
    })
  }

  function listKind() {
    let sql = "SELECT *,productkind.id As idKind FROM productkind "
    sql += "INNER JOIN producttype ON productkind.id_type = producttype.id ORDER BY id_type "
    conn.query(sql, (err, resKind) => {
      dataKind = resKind
      sendData()
    })
  }

  function sendData() {
    console.log(dataKind);

    res.render('kind', {
      title: "ชนิด",
      dataType,
      dataKind
    })
  }

  main()


})
// end ชนิด kind

// add Kind
router.post('/addKind', (req, res) => {
  let data = req.body
  let idType = req.body.type
  let nameKind = req.body.nameKind
  console.log(data);
  let sql = "INSERT INTO productkind (id_type,kindName,active) VALUES (?,?,?)"
  conn.query(sql, [idType, nameKind, letActive], (err, resKind) => {
    res.redirect('../kind')
  })
})
// end add Kind

// สินค้า
router.get('/product', (req, res) => {

  let dataKind = []
  let dataProduct = []

  async function main() {
    await selectKind()
  }

  function selectKind() {
    let sql = "SELECT *,productkind.id As idKind FROM productkind "
    sql += "INNER JOIN producttype ON productkind.id_type = producttype.id ORDER BY id_type "
    conn.query(sql, (err, resKind) => {
      dataKind = resKind
      listProduct()
    })
  }

  function listProduct() {
    let sql = "SELECT *,product.id As idProduct"
    sql += " FROM product"
    sql += " INNER JOIN productkind ON product.id_kind = productkind.id"
    sql += " INNER JOIN producttype ON productkind.id_type = producttype.id"
    sql += " WHERE product.active = 1 "
    conn.query(sql, (err, resPro) => {
      dataProduct = resPro
      sendData()
    })
  }

  function sendData() {
    console.log(dataProduct);

    res.render('product', {
      title: "รายการสินค้า",
      dataKind,
      dataProduct
    })
  }
  main()

})
// end สินค้า
// เพิ่มรายการสินค้า
router.post('/addProduct', (req, res) => {
  let data = req.body
  let idKind = req.body.kind
  let namePro = req.body.nameProduct
  console.log(data);
  let sql = "INSERT INTO product (productName,id_kind,active) VALUES(?,?,?)"
  conn.query(sql, [namePro, idKind, letActive], (err, resProduct) => {
    res.redirect('../product')
  })
})
// end เพิ่มรายการสินค้า



// เพิ่มหน่วย
router.post('/addUnit', (req, res) => {
  let data = req.body
  console.log(data);
  let nameUnit = req.body.nameUnit
  let sql = "INSERT INTO productunit (unitName,active) VALUES(?,?)"
  conn.query(sql, [nameUnit, letActive], (err, resUnit) => {
    if (err) throw console.log(err);

    res.redirect('../unitProduct')
  })

})
// end เพิ่มหน่วย


// หน่วย
router.get('/unitProduct', (req, res) => {
  let dataUnit = []
  async function main() {
    await listUnit()
  }

  function listUnit() {
    let sql = "SELECT * FROM productunit WHERE active = 1 "
    conn.query(sql, (err, resUnit) => {
      dataUnit = resUnit
      sendData()
    })
  }

  function sendData() {
    res.render('unitProduct', {
      title: "กำหนดหน่วย",
      dataUnit
    })
  }
  main()
})
// end หน่วยสินค้า

// เพิ่มแหล่งที่มา
router.post('/addLocate', (req, res) => {
  let data = req.body
  console.log(data);
  let nameLocate = req.body.nameLocate
  let sql = "INSERT INTO locate (locateName,active) VALUES(?,?)"
  conn.query(sql, [nameLocate, letActive], (err, resUnit) => {
    if (err) throw console.log(err);

    res.redirect('../locate')
  })

})
// end เพิ่มแหล่งที่มา

// locate
router.get('/locate', (req, res) => {
  let dataLocate = []
  async function main() {
    await listUnit()
  }

  function listUnit() {
    let sql = "SELECT * FROM locate WHERE active = 1 "
    conn.query(sql, (err, resLoc) => {
      dataLocate = resLoc
      sendData()
    })
  }

  function sendData() {
    res.render('locate', {
      title: "แหล่งที่มา",
      dataLocate
    })
  }
  main()
})
// end locate

// ลบสินค้า
router.get('/delUnit/:id', (req, res) => {
  let id = req.params.id
  let sql = "DELETE FROM productunit WHERE id = ?"
  conn.query(sql, [id], (err, resPro) => {
    if (err) throw console.log(err);
    res.redirect('../unitProduct')
  })
})
// End ลบสินค้า


// ลบสินค้า
router.get('/delLocate/:id', (req, res) => {
  let id = req.params.id
  let sql = "DELETE FROM locate WHERE id = ?"
  conn.query(sql, [id], (err, resPro) => {
    if (err) throw console.log(err);
    res.redirect('../locate')
  })
})
// End ลบสินค้า


// price
router.get('/price/:gDate/:gType', (req, res) => {

  let setDate = req.params.gDate

  let dataProduct = []
  let dataProductOnType = []
  let dataType = []
  let dataUnit = []
  let dataLocate = []

  async function main() {
    await listProduct()
  }

  function listProduct() {
    let sql = "SELECT *,product.id As idProduct"
    sql += " FROM product"
    sql += " INNER JOIN productkind ON product.id_kind = productkind.id"
    sql += " INNER JOIN producttype ON productkind.id_type = producttype.id"
    sql += " WHERE product.active = 1 "
    conn.query(sql, (err, resPro) => {
      dataProduct = resPro
      listType()
    })
  }

  function listType() {
    let sql = consListType
    conn.query(sql, (err, resType) => {
      dataType = resType
      listProductOnType()
    })
  }

  function listProductOnType() {
    let gType = req.params.gType
    let sql = "SELECT *,product.id As idPro"
    sql += " FROM product"
    sql += " INNER JOIN productkind ON product.id_kind = productkind.id"
    sql += " INNER JOIN producttype ON productkind.id_type = producttype.id"
    sql += " WHERE producttype.id = ?  AND product.active = 1"
    // console.log(sql);

    conn.query(sql, [gType], (err, resPro) => {
      dataProductOnType = resPro
      listUnit()
    })
  }


  function listUnit() {
    let sql = "SELECT * FROM productunit WHERE active = 1 "
    conn.query(sql, (err, resUnit) => {
      dataUnit = resUnit
      listLocate()
    })
  }

  function listLocate() {
    let sql = "SELECT * FROM locate WHERE active = 1 "
    conn.query(sql, (err, resLoc) => {
      dataLocate = resLoc
      sendData()
    })
  }

  function sendData() {
    // console.log(dataProductOnType);
    res.render('price', {
      title: "ราคาสินค้า",
      dataProduct,
      dataProductOnType,
      dataType,
      setDate,
      dataLocate, // list แหล่งที่มา
      dataUnit // list หน่วย

    })
  }

  main()
})
// end price

router.post('/selectTypeForPrice', (req, res) => {
  let data = req.body
  let gData = req.body.gDate
  let gType = req.body.gType
  console.log(data);
  res.redirect("../price/" + gData + "/" + gType)
})

router.post('/addPrice', (req, res) => {
  let data = req.body
  let g_idPro = req.body.idPro
  //console.log(g_idPro.length);
  // console.log(data);



  async function main() {
    await insertPrice()
  }



  function insertPrice() {

    // for insert
    let sql = "INSERT INTO productprice "
    sql += "(dateCreate,datePrice,startPrice,endPrice,idProduct,idUnit,idLocate,active)"
    sql += "VALUES(?,?,?,?,?,?,?,?)"

    // for Update
    let sqlUpdate = "UPDATE productprice SET dateCreate = ?,startPrice =?,endPrice=?,idUnit =?,idLocate=? WHERE idProduct = ? AND datePrice = ?"


    let gDateCreate = dateNow
    let gDatePrice = req.body.setDate
    let gStartPrice = req.body.startPrice
    let gEndPrice = req.body.endPrice
    let gIdPro = req.body.idPro
    let gIdUnit = req.body.gUnit
    let gLocate = req.body.gLocate
    //console.log(gStartPrice);
    //res.end()

    //     let gEndPrice =
    let dataSql = ""
    let indexId = 0
    for (let i = 0; i < g_idPro.length; i++) {
      let chkSql = "SELECT * FROM productprice WHERE idProduct = ? AND datePrice = ?"
      conn.query(chkSql, [gIdPro[i], gDatePrice], (err, resChk) => {
        //console.log(resChk);
        if (resChk != "") {
          console.log("มีแล้ว");
          indexId = Number(gIdPro[i])
          conn.query(sqlUpdate, [gDateCreate, gStartPrice[i], gEndPrice[i], gIdUnit[i], gLocate[i], indexId, gDatePrice], (err, resUpdate) => {
            if (err) throw console.log(err);
            console.log(gDateCreate);
            console.log(gIdPro[i]);


            if (i == (g_idPro.length - 1)) {
              sendData()
            }
          })


        } else {
          conn.query(sql, [gDateCreate, gDatePrice, gStartPrice[i], gEndPrice[i], gIdPro[i], gIdUnit[i], gLocate[i], letActive], (err, resIns) => {
            if (err) throw console.log(err);
            if (i == (g_idPro.length - 1)) {
              sendData()
            }
          })
        }
      })
    }
  }

  function sendData() {
    res.end()
  }
  main()
})


router.post('/selectTypeForShow', (req, res) => {
  let data = req.body
  let gData = req.body.gDate
  let gType = req.body.gType
  console.log(data);
  res.redirect("../show/" + gData + "/" + gType)
})
// show price
router.get('/show/:gDate/:gType', (req, res) => {

  let setDate = req.params.gDate

  let dataProduct = []
  let dataProductOnType = []
  let dataType = []
  let dataUnit = []
  let dataLocate = []

  async function main() {
    await listProduct()
  }

  function listProduct() {
    let sql = consShowPrice
    let gType = req.params.gType
    let gDate = req.params.gDate
    conn.query(sql, [gType, gDate], (err, resPro) => {

      dataProduct = resPro
      listType()
    })
  }

  function listType() {
    let sql = consListType
    conn.query(sql, (err, resType) => {
      dataType = resType
      sendData()
    })
  }

  // function listProductOnType() {
  //   let gType = req.params.gType
  //   let sql = "SELECT *,product.id As idPro"
  //   sql += " FROM product"
  //   sql += " INNER JOIN productkind ON product.id_kind = productkind.id"
  //   sql += " INNER JOIN producttype ON productkind.id_type = producttype.id"
  //   sql += " WHERE producttype.id = ?  AND product.active = 1"
  //   // console.log(sql);

  //   conn.query(sql, [gType], (err, resPro) => {
  //     dataProductOnType = resPro
  //     listUnit()
  //   })
  // }


  // function listUnit() {
  //   let sql = "SELECT * FROM productunit WHERE active = 1 "
  //   conn.query(sql, (err, resUnit) => {
  //     dataUnit = resUnit
  //     listLocate()
  //   })
  // }

  // function listLocate() {
  //   let sql = "SELECT * FROM locate WHERE active = 1 "
  //   conn.query(sql, (err, resLoc) => {
  //     dataLocate = resLoc
  //     sendData()
  //   })
  // }

  function sendData() {
    console.log(dataProduct);

    let mDataProduct = dataProduct.map(item => {
      return {
        gDateCreate: moment(item.dataLocate).format('YYYY-MM-DD'),
        gDatePrice: moment(item.datePrice).format('YYYY-MM-DD')
      }
    })

    console.log(mDataProduct);

    res.render('show', {
      title: "ราคาสินค้า",
      dataProduct, // สินค้า list
      mDataProduct, // map วันที่
      dataProductOnType,
      dataType,
      setDate,
      dataLocate, // list แหล่งที่มา
      dataUnit // list หน่วย


    })
  }

  main()
})
// end show price

module.exports = router;