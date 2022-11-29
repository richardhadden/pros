const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const indate = new Date("2022-11-28T11:34:39Z")
console.log(indate.getDay())

const diff = new Date() - indate
console.log(diff)
var dd = Math.floor(diff / 1000 / 60 / 60 / 24);
console.log(dd)