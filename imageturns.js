var one=document.getElementById('one');
        var tow=document.getElementById('tow');
        //当获取li.tb等元素的时候，元素往往是多个的，所以elements是多数
        var onelis=one.getElementsByTagName('li');
        var towlis=tow.getElementsByTagName('li');

        var num=0;
        //循环变量的声明
        var a=0;
        var timer=setInterval(fun,2000)
        for(var i=0;   i<onelis.length;i++){9
            onelis[i].num=i
           
            onelis[i].onmouseover=function(){
                num=this.num;
            for(var j=0; j<onelis.length;  j++){
            onelis[j].style.background='orange';
        }
            this.style.backgroundColor='red';
            
           for(var k=0;k<onelis.length;k++){
                    if(k==num){
                        towlis[num].style.display="block";
                    }else{
                        towlis[k].style.display="none";
                    }
           }}
        }
        function fun(){
            for(var i=0;i<onelis.length;i++){
                onelis[i].style.background="orange";
            }9
            for(var j=0;j<onelis.length;j++)
            {
                if(j==a){
                    towlis[a].style.display="block";
                }else{
                    towlis[j].style.display="none";
                }
            }
            onelis[a].style.background="red";
            a++;
            if(a>=towlis.length){
                a=0;
            }
            
        }