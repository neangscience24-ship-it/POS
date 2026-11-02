- init project 
    cmd : npm init -y
- install express
    cmd : npm install express
- create index.js
- create package.json
- run server
    cmd : node index.js

Homework
1. create route students
    - get all students
    - get student by id
    - create student
    - update student
    - delete student
2. create controller students
    - get all students
    - get student by id
    - create student
    - update student
    - delete student
3. create data students


plug in Nodemong 
cmd : npm install nodemon 
change in package.json
"scripts": {
  "test": "echo \"Error: no test specified\" && exit 1",
  "start": "nodemon index.js"
}


(req, res)

req parameter 
 There are 3 types of request parameters:

 1,req.query - This is an object containing the parameters passed in the query string. 
        Ex : http://localhost:3000?name=John&age=25 
 2,req.params - This is an object containing the parameters passed in the route path.
        Ex : http://localhost:3000/api/v1/product/3
 3,req.body - This is an object containing the parameters passed in the request body.
    


 Homework
 1.In exsitng product route 
    get all product - > already existing 
        - get product by id - > do it 
        - create product - > do it --> get from query paramerter
        - update product - > do it 
        - delete product - > do it

    http:localhost:3000/api/v1/product/3

Homework 
1. create body parameter in employee route
2. update employee route
3. delete employee route


Homework 
1. create productmaster route 
2. create productmaster controller 
3. handle CRUD operation in productmaster controller



Homework
- Create form login using HTML CSS JS
- intergate login with backend 
    endpoint : POST http://localhost:3000/api/v1/user/login
    body:{
        "email": "admin168@gmail.com",
        "password":"M1234"
        }


auth type 

Bearer Token  : "Bearer dsjfhsdkjfjdslkfjsdlkfjksdfhsdjkkkkkkkkkeur938sdjfcdsjkfhdksjfs"  split("  ")
           var token = ["Bearer" , "dsjfhsdkjfjdslkfjsdlkfjksdfhsdjkkkkkkkkkeur938sdjfcdsjkfhdksjfs"]
                tokenUsed = token[1]




step to send telegram message vai bot 
1 - create bot telegram 
    - token  bot: 7745997939:AAHW-5Le4xflCe1jzvygfMmas4srFsaP03g 
    - group id : -1004353592882
    - my personal id : 1001388981
2 - npm i node-telegram-bot-api
3 - get bot send message var plugin 




HOmework
1- create Form to handle message text 
2- intergrate with api 



step to send gmail 
    1 - Gmail Sender : pkhouch97@gmail.com
        App password : i j y h u w l p j w e n z c v r
    2 - npm i nodemailer 
    3 - email_config 


Homework
1. Create Student Route
2. Implement CRUD operation in Student Controller
3. tigger action when create student and send message to telegram && 
store in log file && when Delete student send message to to email 
4. Form Login -> Form register  


#flow for reset new password and send otp to email for verify 
1- send otp to email 
2- verify otp 
3- reset new password

Homework 
1- Create From login and forgot password 
2- intergrate with api send otp and verify
3- if OTP verify succes , can reset -new pw 



Sequelize 
- CRUD operation
- Where condition in sequelize
- Join table


Inner join 
left join 
right join



# Strip Payway
1. create checkout session 
2. success payment
# step to create stripe account 
https://dashboard.stripe.com/register
# step to create stripe key 
https://dashboard.stripe.com/test/apikeys
get only test key
SCRECT_KEY : sk_test_51I1s0o1o0o1o0o1o0o1o0o1o0o1o0o1o0o1o0o1o0o1o0o1o0o1o0o1o
PUBLISHABLE_KEY : pk_test_51I1s0o1o0o1o0o1o0o1o0o1o0o1o0o1o0o1o0o1o0o1o0o1o0o1o0o1o


Homework
1- create card product (Frontend)
2- can process payment with api to stripe


