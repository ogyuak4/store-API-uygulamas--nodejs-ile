const Product= require('../models/product')


const getAllProductsStatic=async (req,res)=>{   //bu test etmek için var
    const products=await Product.find({featured:true})
    res.status(200).json({products, nbHits:products.length})
}

const getAllProducts=async (req,res)=>{
    const{featured,company,name,sort,fields, numericFilters}=req.query
    const queryObject={}

    if(featured){
        queryObject.featured=featured==='true'?true:false
    }

    if(company){
        queryObject.company=company
    }
    if(name){  //regex direkt name değerindense aranan değeri içeren her bi nameyi bulmamızı sağlıyor
        queryObject.name={$regex:name,$options:'i'}
    } //options i büyük küçük harf duyarlılığına önem vermediğimizi söylüyor


    if (numericFilters) { // test etmek istiyorsan buyur http://localhost:3000/api/v1/products?sort=name&fields=name,price&limit=44&page=1&numericFilters=price%3E50,rating%3E=4

        const operatorMap = {
          '>': '$gt', //greater then
          '>=': '$gte',
          '=': '$eq',
          '<': '$lt', //little then
          '<=': '$lte',
        };
        const regEx = /\b(<|>|>=|=|<|<=)\b/g;  //bu regular expressionu stackoverflowdan bulduk
        let filters = numericFilters.replace(  //bu da bu yukardaki iki değeri değiştirmeni böylece mongoosenin anladığı şeyi girmeni sağlıyor
            regEx,
            (match) => `-${operatorMap[match]}-`
        );
        const options = ['price', 'rating'];
        filters = filters.split(',').forEach((item) => {
            const [field, operator, value] = item.split('-'); //bu - sayesinde 3 değeri ayırdık
            if (options.includes(field)) {
                queryObject[field] = { [operator]: Number(value) }; //string olarak geldiği için number'a çevirdik
            }
        });
    }


    // console.log(queryObject)
    let result= Product.find(queryObject)


    //sort
    if(sort){
        const sortList=sort.split(',').join(' ')
        result=result.sort(sortList)
    }
    else{
        result=result.sort('createAt') 
    }


    if(fields){ //for example you want to see only name, than you should go in this:http://localhost:3000/api/v1/products?fields=name
        const fieldsList=fields.split(',').join(' ')
        result=result.select(fieldsList)
    }
    
    const page= Number(req.query.page) || 1
    const limit=Number(req.query.limit)  || 10
    const skip=(page-1)*limit;
    result=result.skip(skip).limit(limit)  //burdaki mantık mökemmel, üzerinde düşün anlarsın

    //test etmek için şuraya girebilirsin: http://localhost:3000/api/v1/products?sort=name&fields=name,price&limit=4&page=2




    const products=await result
    res.status(200).json({products,nbHits:products.length})
}

module.exports={
    getAllProducts,
    getAllProductsStatic
}