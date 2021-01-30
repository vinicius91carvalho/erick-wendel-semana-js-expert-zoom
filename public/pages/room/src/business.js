class Business {
    constructor({ room, media, view, socketBuilder, peerBuilder }) {
        this.room = room
        this.media = media
        this.view = view
        
        this.socketBuilder = socketBuilder
        this.peerBuilder = peerBuilder

        this.socket = {}
        this.currentStream = {}
        this.currentPeer = {}

        this.peers = new Map()

        this.onCurrentStreamLoaded = () => {}
    }

    static initialize(deps) {
        const instance  = new Business(deps)
        return instance._init()
    }

    async _init() {
        this.socket = this.socketBuilder
            .setOnUserConnected(this.onUserConnected())
            .setOnUserDisconnected(this.onUserDisconnected())
            .build()

        this.currentPeer = await this.peerBuilder
            .setOnError(this.onPeerError())
            .setOnConnectionOpened(this.onPeerConnectionOpened())
            .setOnCallReceived(this.onPeerCallReceived())
            .setOnPeerStreamReceived(this.onPeerStreamReceived())
            .build()

        this.currentStream = await this.media.getCamera()
        this.onCurrentStreamLoaded()

        this.addVideoStream('test01')
    }

    addVideoStream(userId, stream = this.currentStream) {
        this.view.renderVideo({
            userId,
            stream,
            isCurrentId: false
        })
    }

    onUserConnected = function () {
        return userId => {
            console.log('user connected!', userId)
            this.currentPeer.call(userId, this.currentStream)
        }
    }
    
    onUserDisconnected = function () {
        return userId => {
            console.log('user disconnected!', userId)
        }
    }

    onPeerError = function() {
        return error => {
            console.log('error on peer!', error)
        }
    }

    onPeerConnectionOpened = () => {
        return peer => {
            const id = peer.id
            console.log('Peer connected! ID: ', id)
            this.socket.emit('join-room', this.room, id)
        }
    }

    _answerCall = call => {
        console.log('answering call', call)
        call.answer(this.currentStream)
    }

    onPeerCallReceived = () => {
        return call => {
            if (this.currentStream instanceof MediaStream) {
                this._answerCall(call)
            } else {
                console.log('waiting for stream to load')
                this.onCurrentStreamLoaded = () => this._answerCall(call)
            }
        }
    }

    onPeerStreamReceived = () => {
        return (call, stream) => {
            const callerId = call.peer
            console.log('caller id: ', callerId)
            console.log('stream: ', stream)
            this.addVideoStream(callerId, stream)
            this.peers.set(callerId, { call })
            this.view.setParticipants(this.peers.size)
        }
    }
}