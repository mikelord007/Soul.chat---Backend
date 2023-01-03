import { Interests, SoulsActive } from "./interfaces";
const { createServer } = require("http");
const { Server } = require("socket.io");
const dotenv = require('dotenv')


dotenv.config()

const PORT = process.env.PORT || 5000;

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

const interests: Interests = {}
const soulsActive: SoulsActive = {}
const FreeSouls: Array<string> = []

const clearSoulFromMemory = (socketId) => {
    console.log("clearing user: ", socketId)

    if(socketId in soulsActive) {

        soulsActive[socketId].interests.forEach(disconnectedUserInterest => {
            interests[disconnectedUserInterest] = interests[disconnectedUserInterest].filter(userId => userId !== socketId)

            if (interests[disconnectedUserInterest].length === 0)
                delete interests[disconnectedUserInterest]

        })

        delete soulsActive[socketId]

    }

    const idx = FreeSouls.findIndex((soul) => soul === socketId)

    if(idx > -1){
        FreeSouls.splice(idx,1)
    }

}

const exchangeRTCData = (soul1, soul2) => {
    const soul2Data = soulsActive[soul2]

    io.to(soul1).emit("initiate",soul2Data, soul2)
}

const connectSouls = () => {
    Object.keys(interests).forEach((key) => {
        if(interests[key].length > 1) {
            exchangeRTCData(interests[key][0],interests[key][1]);
            clearSoulFromMemory(interests[key][1])
            clearSoulFromMemory(interests[key][0])
        }
    })
    
    if(FreeSouls.length > 1){
        exchangeRTCData(FreeSouls[0],FreeSouls[1])
        clearSoulFromMemory(FreeSouls[1])
        clearSoulFromMemory(FreeSouls[0])
    }
}

io.on("connection", (socket) => {

  socket.on("interests", (data) => {
    
    soulsActive[socket.id] = data;

    data.interests?.forEach((interest) => {
        if(interest in interests)
            interests[interest].push(socket.id)
        else
            interests[interest] = [socket.id]
    })

  })

  socket.on("disconnect",() => {
    console.log("disconnecting: ", socket.id)
    clearSoulFromMemory(socket.id)
  })

  socket.on("passingPeerData", (peerData, soul1Data, soul2ID) => {
    console.log("here passing peer data")
    io.to(soul2ID).emit("matchMade",peerData, soul1Data)
  })

});

setInterval(() => {
    connectSouls()
    // console.log("log:", soulsActive, interests)
}, 600)

setInterval(() => {
    console.log("soulsActive: ", soulsActive,"\ninterests: ", interests)
},2000)

httpServer.listen(PORT,() => {
    console.log(`running on ${PORT}`)
});