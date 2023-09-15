let dbmgr = require("./dbmgr");
let db = dbmgr.db;

exports.getNames = () =>{
    let rows = []

    db.each("SELECT rowid AS id, info FROM lorem", (err, row) => {
        rows.push(row.info)

        document.getElementById("names").innerHTML = row.info;
    })
    console.log("----------")
    console.log(rows)
    console.log("----------")

    return rows;
    }