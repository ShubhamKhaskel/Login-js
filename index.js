function login()
{
    var v=document.getElementById('username').value;
    var p=document.getElementById('password').value;
    
    if(v.includes('@gmail.com') && p.length>=5)
    {
        location.assign("http://127.0.0.1:5500/index2.html");
    }
    else
    {
        alert("Login failed");
    }
}
function gan()
{
    var sound=document.getElementById("audio");
    sound.play();
}
function func2()
{
    var sound=document.getElementById("gan2");
    sound.play();
}