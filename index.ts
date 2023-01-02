const { createServer } = require("http");
const { Server } = require("socket.io");

interface SoulsActive {
    [key: string]: {
        interests: Array<string>,
        connectWithMostSoulful: boolean
    }
}

interface Interests {
    [key: string]: Array<string>
}


const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });



const interests: Interests = {}
const soulsActive: SoulsActive = {}

io.on("connection", (socket) => {

  socket.on("interests",(data) => {
    
    soulsActive[socket.id] = data;

    data.interests.forEach((interest) => {
        if(interest in interests)
            interests[interest].push(socket.id)
        else
            interests[interest] = [socket.id]
    })

  })

  socket.on("disconnect",() => {

    if(socket.id in soulsActive) {

        soulsActive[socket.id].interests.forEach(disconnectedUserInterest => {
            interests[disconnectedUserInterest] = interests[disconnectedUserInterest].filter(elem => elem !== socket.id)

            if (interests[disconnectedUserInterest].length === 0)
                delete interests[disconnectedUserInterest]
                
        })

        delete soulsActive[socket.id]

    }

  })
});

setInterval(() => {
    console.log("interests: ", interests)
    console.log("soulsActive: ", soulsActive)
}, 2000)

httpServer.listen(5000,() => {
    console.log("running on 5000")
});