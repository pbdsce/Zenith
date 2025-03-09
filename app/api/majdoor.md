resume storing as link...data sending should in format of link
bio is of 100words...500 chars
recaptcha ka code check karlo
why get request for checking the email present or not
curl -X POST http://localhost:3000/api/registration \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe2@example.com",
    "phone": "9876543211",
    "resume_link": "https://storage.googleapis.com/your-bucket/resumes/johndoe.pdf",
    "leetcode_profile": "https://leetcode.com/johndoe",
    "github_link": "https://github.com/johndoe",
    "linkedin_link": "https://linkedin.com/in/johndoe",
    "competitive_profile": "https://codeforces.com/profile/johndoe",
    "bio": "Full-stack developer with 2 years of experience",
    "age": "25",
    "college_name": "Example University",
    "profile_picture": "https://cloudinary.com/your-account/images/johndoe.gif",
    "referral_code": "APNAADMI",
    "recaptcha_token": "pbstruggles"
  }'

  updated the next config js using poweredby headr false 
phone number why intl.?
registration
LAVI:
POST - CLOUDINARY
  resume ka post api
  profile pic ka post api
  resume/profile pic updating in PUT api...users/[id] route

users
[id]
GET - ?? response (single user) all deets
Update - user can do...except name all 
update(admin) - status update
Delete - (admin) - delete users,
route.ts
GET - all users + uid name email ph no resume pic


CURL tests: 

Register Users: curl -X POST \
  -F "name=John Doe" \
  -F "email=john.doe@example2.com" \
  -F "phone=9876543222" \
  -F "age=25" \
  -F "college_name=Example University" \
  -F "bio=I am a software developer with interests in web development and AI." \
  -F "github_link=https://github.com/johndoe" \
  -F "linkedin_link=https://linkedin.com/in/johndoe" \
  -F "leetcode_profile=https://leetcode.com/johndoe" \
  -F "portfolio_link=https://johndoe.dev" \
  -F "referral_code=APNAADMI" \
  -F "resume=@/home/shinichi/Documents/v5.pdf" \
  -F "profile_picture=@/home/shinichi/Documents/trial/dp.jpg" \
  -F "recaptcha_token=trial" \
  http://localhost:3000/api/registration

Get All Users : curl -X GET "http://localhost:3000/api/users"

Get a Specific User : curl -X GET "http://localhost:3000/api/users/KviZ2B5vAgvvOnNqf1SL"

Update User Fields (except Name): curl -X PUT "http://localhost:3000/api/users/KviZ2B5vAgvvOnNqf1SL" \
     -H "Content-Type: application/json" \
     -d '{
           "email": "newemail@example.com",
           "phone": "+1234567890",
           "resume": "https://resume.link/new.pdf"
          }'

Update User status (admin only) : curl -X PUT "http://localhost:3000/api/users/KviZ2B5vAgvvOnNqf1SL/status" \
     -H "Content-Type: application/json" \
     -d '{
           "uid": "{admin_UID}",
           "status": "Accepted"
         }'


Delete User (admin only): curl -X DELETE "http://localhost:3000/api/users/KviZ2B5vAgvvOnNqf1SL" \
     -H "Content-Type: application/json" \
     -d '{
           "uid": "{admin_UID}"
         }'

Register admin: curl -X POST "http://localhost:3000/api/admin/" \
     -H "Content-Type: application/json" \
     -d '{
           "email": "admin@pointblank.club",
           "password": "SecurePass123",
           "secret": "pbstruggles"
         }'