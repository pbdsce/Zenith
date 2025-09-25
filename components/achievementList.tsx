type AchievementList = {
  [key: string]: { name: string; achievements: string[] }[];
  GSoC: { name: string; achievements: string[] }[];
  "Smart India Hackathon": { name: string; achievements: string[] }[];
  Hackathons: { name: string; achievements: string[] }[];
  CP: { name: string; achievements: string[] }[];
  LFX: { name: string; achievements: string[] }[];
};

export const achievementList: AchievementList = {
    GSoC: [
        { name: "Ashutosh Pandey", achievements: ["GSoC '20 @Arduino", "GSoC '21 @LLVM"] },
        { name: "Akash Singh", achievements: ["GSoC '24 @Keploy"] },
        { name: "Aditya", achievements: ["GSoC '24 @Mifos"] },
        { name: "Uttkarsh", achievements: ["GSoC '24 @OWASP"] },
        { name: "Rahul Jagwani", achievements: ["GSoC '23 @BMI", "GSoC '24 @GA4GH", "GSoC '25 @Alaska"] },
        { name: "Prajwal S N", achievements: ["Mentor GSoC'25", "Mentor @CRIU GSoC'24", "GSoC '23 @CRIU", "GSoC '22 @CRIU"] },
        { name: "Pratyush Singh", achievements: ["GSoC '23 @Mifos", "GSoC '24 @Mifos","Mentor GSoC'25"] },
        { name: "Aditya B N", achievements: ["GSoC '23 @MIT App Inventor"] },
        { name: "Jigyasa Gupta", achievements: ["GSoC '23 @NRNB"] },
        { name: "Kirthi Lodha", achievements: ["GSoC '22 @AOSSIE"] },
        { name: "Sreeniketh Madgula", achievements: ["GSoC '22 @AOSSIE"] },
        { name: "Jeffrey Paul", achievements: ["GSoC '21 @SunPy"] },
        { name: "Saalim Quadri", achievements: ["GSoC '25 @The Linux Foundation"] },
        { name: "Dhruv Puri", achievements: ["GSoC '25 @Prometheus-Operator"] },
        { name: "Bhuvan M", achievements: ["GSoC '25 @DeepChem"] },
        { name: "Manas Hejmadi", achievements: ["GSoC '25 @API Dash"] },
        { name: "Suvan Banerjee", achievements: ["GSoC '25 @Open Climate Fix"] },
        { name: "Shuvam Pal", achievements: ["GSoC '25 @Invesalius"] },
        { name: "Ayush Singh", achievements: ["GSoC '25 @IOOS","GSoC '24 @IOOS"] },
        { name: "Hariom Chaturvedi", achievements: ["GSoC '21 @Honeynet"] },
      ],
      "Smart India Hackathon": [
        { name: "Ashutosh Pandey", achievements: ["Winner 2019"] },
        { name: "Bapu Pruthvidhar", achievements: ["Winner 2019"] },
        { name: "Rithik Raj Pandey", achievements: ["Finalist 2022"] },
        { name: "Prakhar Tibrewal", achievements: ["Winner 2019"] },
        { name: "Kritik Modi", achievements: ["Winner 2022"] },
        { name: "Debayan Ghosh", achievements: ["Winner 2024"] },
        { name: "Bhoomi Agrawal", achievements: ["Winner 2024"] },
        { name: "Kamini Banait", achievements: ["Winner 2024"] },
        { name: "Taneesha M", achievements: ["Winner 2024"] },
        { name: "Vivek Agarwal", achievements: ["Winner 2024"] },
        { name: "Naman Parlecha", achievements: ["Winner 2024"] },
        { name: "Prajwal K P", achievements: ["Winner 2024"] },
        { name: "Inchara J", achievements: ["Winner 2024"] },
        { name: "Mrityunjay Singh", achievements: ["Winner 2024"] }
      ],
      Hackathons: [
        { name: "Akash Singh", achievements: [
      "Finalist @ HackGlobal Singapore",
      "Grand Winner @ NITK’25",
      "Grand Winner @ Warpspeed",
      "Winner @ Hackbanglore 2025",
      "Runner-up @ JIT Hack 2023"
    ] 
  },
  { name: "Bhoomi Agrawal", achievements: [
      "Winner @ HackToFuture by St.Josephs",
      "Podium Finish @ Cellstrat Cellverse Hackathon",
      "Winner Business Pitch Track @ Aventus 3.0"
    ] 
  },
  { name: "Kamini Banait", achievements: [
      "Winner @ HackToFuture by St.Josephs",
      "Podium Finish @ Cellstrat Cellverse Hackathon",
      "Winner Business Pitch Track @ Aventus 3.0"
    ] 
  },
  { name: "Vivek Agarwal", achievements: ["Winner @ Innerve 9.0 2025"] },
  { name: "Naman Parlecha", achievements: ["Winner @ Innerve 9.0 2025"] },
  { name: "Prajwal K P", achievements: [
      "Winner @ HackToFuture by St.Josephs",
      "Podium Finish @ Cellstrat Cellverse Hackathon",
      "Winner Business Pitch Track @ Aventus 3.0"
    ] 
  },
  { name: "Inchara J", achievements: [
      "Winner @ Hacknocturne by SMVIT",
      "Winner @ Warpspeed"
    ] 
  },
  { name: "Abhyuday", achievements: ["Finalist @ HackGlobal Singapore"] },
  { name: "Shreyas Reddy B", achievements: ["NITK Grand Winner 2025"] },
  { name: "Dhruv Puri", achievements: [
      "NITK Grand Winner 2025",
      "Winner @ Aegis Sandbox"
    ] 
  },
  { name: "Pragati Raj", achievements: [
      "NITK Cybersecurity Track Grand Winner 2025",
      "Winner @ Aegis Sandbox"
    ] 
  },
  { name: "Tanmay R K", achievements: ["NITK Cybersecurity Track Grand Winner 2025"] },
  { name: "R Aswin", achievements: [
      "NITK Cybersecurity Track Grand Winner 2025",
      "Winner @ Ethindia 2024"
    ] 
  },
  { name: "Chetan R", achievements: ["NITK AI Track Grand Winner 2025"] },
  { name: "Alfiya Fatima", achievements: [
      "NITK AI Track Grand Winner 2025",
      "Winner @ SentinelHack 2025"
    ] 
  },
  { name: "Yuktha P S", achievements: ["NITK AI Track Grand Winner 2025"] },
  { name: "Harsh Kumar Gupta", achievements: [
      "Winner @ Hacknocturne by SMVIT",
      "Winner @ Warpspeed"
    ] 
  },
  { name: "Shubhang Sinha", achievements: ["Winner @ Hacknocturne by SMVIT"] },
  { name: "Darshil Mahraur", achievements: ["Winner @ NITK"] },
  { name: "Angelica Singh", achievements: ["Winner @ Kanpur Design Hackathon"] },
  { name: "Anshu Pandey", achievements: [
      "1st position @ IEEE MUJ",
      "2nd position @ IEEE Codify",
      "3rd position @ Karnataka Police Hackathon"
    ] 
  },
  { name: "Aditya Khattri", achievements: ["Runner-up @ Hackman 2023"] },
  { name: "Tushar Mahopatra", achievements: ["3rd place @ Aegis Sandbox"] },
  { name: "Ayush Singh", achievements: ["3rd place @ Aegis Sandbox"] },
  { name: "Yash Agarwal", achievements: ["3rd place @ Aegis Sandbox"] },
  { name: "Md Raqeeb Haider", achievements: ["2nd Runner-up @ Aventus 3.0"] },
  { name: "Rishiraj Chirchi", achievements: ["Winner @ SentinelHack 2025"] },
  { name: "Areeb Ahmed", achievements: ["Winner @ SentinelHack 2025"] },
  { name: "J R Vanisha", achievements: ["Winner of Women Track @ Aventus 3.0"] },
  { name: "H Sanjay", achievements: [
      "Winner of Innovative Consumer App (Base) @ ETH India 2024",
      "Open Innovation Track Prize @ SheCodes 2024"
    ] 
  
  },
      ],
      CP: [
        { name: "Soumya Pattanayak", achievements: [
            "First team to qualify to ICPC regionals from DSCE",
            "Expert @CF, 5* @CC",
            "Ranked 221 worldwide in Google KickStart '20 Round H"
          ] 
        },
        { name: "Priyanshu Gupta", achievements: [
            "Candidate Master Codeforces",
            "ACM-ICPC Regionalist",
            "India rank 25 Leetcode"
          ] 
        },
        { name: "Calan Pereira", achievements: [
            "3 Times ICPC Regionalist (AIR 47 best rank)",
            "Won 2 national-level coding contests"
          ] 
        },
        { name: "Mohit Agarwal", achievements: [
            "CodeChef 4* and 235th rank in CodeChef Long Challenge",
            "1st place in Nokia Contest 2020"
          ] 
        },
        { name: "Yash Nandwana", achievements: ["ACM-ICPC Regionalist"] },
        { name: "Kritik Modi", achievements: [
            "ACM ICPC Regionalist 2022",
            "6 Stars Codechef",
            "Codeforces Expert",
            "India rank 86 Meta Hacker Cup"
          ] 
        },
        { name: "Aditya Raj", achievements: [
            "ICPC Regionalist 2024",
            "Expert - Codeforces",
            "5 Stars - CodeChef"
          ] 
        },
        { name: "Yuvraj Shorewala", achievements: [
            "Top 0.6% in IICPC Codefest",
            "Expert - Codeforces",
            "5 Stars - CodeChef"
          ] 
        },
        { name: "Prasham Vipul Prabhakar", achievements: [
          "ICPC'23'24 regionalist",
          "Candidate Master"
        ] 
        } 
      ],
      LFX: [
        { name: "Ashutosh Pandey", achievements: ["LFX '20 with Intel Mobileye"] },
        { name: "Akash Singh", achievements: ["LFX '25 with LitmusChaos"] },
        { name: "Saalim Quadri", achievements: ["LFX '23 in Linux Kernel Mentorship"] },
        { name: "Vishruth Thimmaiah", achievements: ["LFX '25 with WasmEdge"] },
        { name: "Naman Parlecha", achievements: ["LFX '25 with Prometheus"] },
        { name: "Yash Agarwal", achievements: ["LFX '25 with CloudNativePG"] },
        { name: "Dhruv Puri", achievements: ["LFX '25 with Kyverno"] },
        { name: "Madhur Kumar", achievements: ["LFX '25 in Linux Kernel Mentorship"] }
      ]
};