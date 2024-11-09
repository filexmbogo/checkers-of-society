const mongoose =require('mongoose')


const userschema= new mongoose.Schema({
    email:{type:String,
        required:true,
    },
    givenid:{type:String,
        required:true,
    },name:{type:String,
        required:true,
    },
})
const user=mongoose.model('user',userschema)
module.exports=user;