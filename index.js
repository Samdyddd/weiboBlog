var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

//加密
//var bcrypt = require('bcrypt');

//var SALT_WORK = 10;

var app = express();
app.listen(3000);

//设置模板文件目录
app.set('views',path.join(__dirname,'./views'));
//引入模板类型
app.set('view engine','ejs');

//静态文件
app.use(express.static(path.join(__dirname,'public')));
app.use(express.static(path.join(__dirname,'views')));

//返回的对象是一个键值对，当extended为false的时候，键值对中的值就为'String'或'Array'形式，为true的时候，则可为任何数据类型。
//使用中间件
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(bodyParser.urlencoded({extended:true}));

//连接数据库
var url = "mongodb://localhost:27017/weibo";
mongoose.connect(url,function(){
  console.log('连接成功 ')
})

//session cookie中间件
app.use(cookieParser('sessiontest'));
app.use(express.session({
	secret:'sessiontest',
	store: new mongoStore({
		url: url,
		collection:'user'
	})
	
}))


//操作user集合
var obj = new mongoose.Schema({
  username:String,
  password:String
});
var node = mongoose.model('user',obj,'user');

//操作message集合
//versionKey版本锁，是mongoose默认配置的“__v”属性，可以定制和取消
//定制 new mongoose.Schema({},{versionKey:'__someKey'})
//取消new mongoose.Schema({},{versionKey:false});
var obj2 = new mongoose.Schema({
  messagefield:{
	  time:String,
	  messageString:String
  },
  username:String
});
var node2 = mongoose.model('message',obj2,'message');

//获取5个字段

/*
关于更新的问题：
这里，利用Model模型查询到了person对象，该对象属于Entity，可以有save操作，如果使用Model`操作，需注意：

    PersonModel.findById(id,function(err,person){
      person.name = 'MDragon';
      var _id = person._id; //需要取出主键_id
      delete person._id;    //再将其删除
      PersonModel.update({_id:_id},person,function(err){});
      //此时才能用Model操作，否则报错
    });

update第一个参数是查询条件，第二个参数是更新的对象，但不能更新主键，这就是为什么要删除主键的原因。

    PersonModel.update({_id:_id},{$set:{name:'MDragon'}},function(err){});







*/








//首页路由
app.get('/',function(req,res){
  //res.render('index',{title:'首页'});
  //var page = req.query.p?parseInt(req.query.p):1;
  console.log(node2.aggregate());
  node2.find({},{},function(err,docu){
	  if(err){
		  console.log(err);
	  }else{    
	//console.log(docu);
	res.render('index',{data:docu,title:'首页'});
	  }
	}).sort({"messagefield":-1,"username":-1});

});



//用户注册
app.get('/reg',function(req,res){
	res.render('reg',{title:'用户注册'})

});

app.post('/reg',function(req,res,next){
	var self = this;
	if(req.body['password-repeat']!=req.body['password']){
		return res.redirect('/reg');
	}else{
		var username = req.body.username;
		var password = req.body.password;
		//加密密码
		/*bcrypt.genSalt(SALT_WORK,function(err,salt){
			if(err) return next(err);
			bcrypt.hash(self.password,salt,function(err,hash){
				if(err) return next(err)
					
				self.password = hash
				next()
			})
		})
		*/
		node.find({username:username},function(err,docus){
			if(err){
				console.log(err);
			}else if(docus!=''){
				console.log(docus);
				return res.redirect('/reg');
			}else{
				node.create({username:username,password:password},function(err){
					if(err){
					console.log(err);
					}else{
						console.log('插入成功');
					}
				});

				return res.redirect('/login');
			}
			
		});	
		
	}
	
	
})
 
//用户登录
app.get('/login',function(req,res){
	res.render('login',{title:"登录"})
});

app.post('/login',function(req,res){
	//var checkboxname = req.body.
	var username = req.body.username;
	var password = req.body.password;
	
	var user={
		username:username,
		password:password
	}
	req.session.user=user;
	
	node.find({username:username},function(err,docus){
		if(err){
				console.log(err);
			}else if(docus!=''&&docus[0].username==username&&docus[0].password==password){
				res.redirect('/user/:'+username);
				}else{
					res.redirect('/login');
				}
	});
})



//用户主页
app.get('/user/:user',function(req,res){
	//console.log(req.session.user);
	if(req.session.user){
		var user = req.session.user;
		node2.find({},function(err,docu){
	  if(err){
		  console.log(err);
	  }else{    
	
	res.render('userIndex',{data:docu,title:'个人主页',name:user});
	//console.log(docu);
	  }
	}).sort({"messagefield":-1,"username":-1});;
	}else{
		res.send('该用户没有登录');
	}
});





//发表信息
app.post('/postMessage',function(req,res){
	
	
	
	var user = req.session.user;
	var name = user.username;
	var message = req.body.message;
	var time = new Date();
	
	
	node2.find({username:name},function(err,docus){
		if(err){
			console.log(err);
		}else if(docus.username!=''){
			node2.create({username:name,messagefield:{time:time,messageString:message}},function(err){
					if(err){
					console.log(err);
					}else{
						console.log('插入成功');
						res.redirect('/user/:'+name);
						
					}
				});
		}
	});
	

});


//用户登出
app.get('/logout',function(req,res){

});

















