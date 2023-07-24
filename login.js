function login(){
       
  let login_acount= document.getElementById("login_acount").value;
  let login_password = document.getElementById("login_password").value;
  var xhr = new XMLHttpRequest();          
  xhr.open('POST',"http:localhost:3006/login?login_acount="+login_acount+"&login_password="+login_password+"", true);
  xhr.onreadystatechange = function() {
  // readyState == 4说明请求已完成
  if (xhr.readyState == 4 && xhr.status == 200 || xhr.status == 304) { 
      // 从服务器获得数据 
      if(xhr.responseText==='success'){
           console.log(xhr.responseText);  
      document.getElementById("name").innerHTML=login_acount;
      
          document.getElementById("loginbox").style.display="none";
          alert("登陆成功")}
          else{
              alert("登陆失败")
          }
     
          
  }
  };
  xhr.send();
 }
  function changepassword(){
      let login_acount= document.getElementById("login_acount").value;
       let login_password = document.getElementById("login_password").value;
  }
  function loginisvisual(){
      document.getElementById("change_password_main").style.display="none";
      document.getElementById("signbox_main").style.display="none";
      document.getElementById("loginbox_main").style.display="block";
  }
  function signisvisual(){
      document.getElementById("change_password_main").style.display="none";
      document.getElementById("loginbox_main").style.display="none";
      document.getElementById("signbox_main").style.display="block";
      
  }
  function cancellogin(){
      document.getElementById("loginbox").style.display="none";

  }
  function show(){
      
      document.getElementById("loginbox").style.display="block";
  }
  function forgotname(){
      document.getElementById("loginbox_main").style.display="none";
      document.getElementById("signbox_main").style.display="none";
      document.getElementById("change_password_main").style.display="block";
  }
  function sign(){
          let sign_acount= document.getElementById("sign_acount").value;
       let sign_password = document.getElementById("sign_password").value;
       let sign_fonfirm_password = document.getElementById("sign_fonfirm_password").value;
      if (sign_password==sign_fonfirm_password){
          var xhr = new XMLHttpRequest();          
          xhr.open('POST',"http:localhost:3006/sign?sign_acount="+login_acount+"&sign_password="+sign_password+"", true);
          xhr.onreadystatechange = function() {
          // readyState == 4说明请求已完成
          if (xhr.readyState == 4 && xhr.status == 200 || xhr.status == 304) { 
              // 从服务器获得数据 
              //console.log(xhr.responseText);  
              document.getElementById("name").innerHTML=sign_acount;

                  document.getElementById("loginbox").style.display="none";
                  alert("注册成功")
                  
          }   
          };
          xhr.send();
      }else{
          alert("密码不一致")
      }
  }