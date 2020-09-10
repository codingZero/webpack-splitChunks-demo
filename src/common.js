console.log("common")
let module1 = {
  size: 4
}

let module2 = {
  size: 7
}

let module3 = {
  size: 2
}

let module4 = {
  size: 5
}


let modules = [module1, module2, module3, module4]

modules.sort((m1, m2) => {
  return m2.size - m1.size;
})

console.log(modules)
