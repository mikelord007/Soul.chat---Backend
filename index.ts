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

    if(socketId in soulsActive) {

        soulsActive[socketId].interests.forEach(disconnectedUserInterest => {
            if(interests[disconnectedUserInterest]) {
                interests[disconnectedUserInterest] = interests[disconnectedUserInterest].filter(userId => userId !== socketId)

                if (interests[disconnectedUserInterest].length === 0)
                    delete interests[disconnectedUserInterest]
            }
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
    io.to(soul1).emit("initiateWebRTC",soul2Data, soul2)
}

const connectSouls = () => {
    console.log("interests: ", interests)
    Object.keys(interests).forEach((key) => {
        if(interests[key]?.length > 1) {
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

const addToFreeSouls = (socketID) => {
    if(!FreeSouls.includes(socketID))
        FreeSouls.push(socketID)
}

const setupSocketListeners = (socket) => {

    socket.on("interests", (data) => {
        console.log("received interests", data)
        soulsActive[socket.id] = data;

        if(data.interests.length<=0){
            addToFreeSouls(socket.id)
            return
        }
    
        data.interests?.forEach((interest) => {
            if(interest in interests)
                {
                    if(!interests[interest].includes(socket.id)) interests[interest].push(socket.id)
                }
            else
                interests[interest] = [socket.id]
        })
    
    })
    
    socket.on("disconnect",() => {
    clearSoulFromMemory(socket.id)
    })

    socket.on("passingPeerData", (peerData, soul1Data, soul2ID, soul2Address) => {
    io.to(soul2ID).emit("matchMadeWithRemoteWebRTC",peerData, soul1Data, socket.id, soul2Address)
    })

    socket.on("rePassingPeerData", (peerData, soul2ID, soul2Address) => {
    io.to(soul2ID).emit("rePassedStreamData",peerData, soul2Address)
    })

    socket.on("skipSoul", (soul2Id, callback) => {
        io.to(soul2Id).emit("soulSkipped");
        callback();
    })

    socket.on("makeMeFreeSoul",(soulParams) => {
        clearSoulFromMemory(socket.id)
        soulsActive[socket.id] = soulParams;
        addToFreeSouls(socket.id)
    })
}

io.on("connection", (socket) => {

  setupSocketListeners(socket);

});

setInterval(() => {
    connectSouls()
}, 600)

setInterval(() => {
    console.log("soulsActive: ", soulsActive,"\ninterests: ", interests, "\nnum active: ", io.sockets.sockets.size)
},2000)

httpServer.listen(PORT,() => {
    console.log(`running on ${PORT}`)
});