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
        this.usersRecordings = new Map()

        this.onCurrentStreamLoaded = () => {}
    }

    static initialize(deps) {
        const instance  = new Business(deps)
        return instance._init()
    }

    async _init() {

        this.view.configureRecordButton(this.onRecordPressed.bind(this))

        this.socket = this.socketBuilder
            .setOnUserConnected(this.onUserConnected())
            .setOnUserDisconnected(this.onUserDisconnected())
            .build()

        this.currentPeer = await this.peerBuilder
            .setOnError(this.onPeerError())
            .setOnConnectionOpened(this.onPeerConnectionOpened())
            .setOnCallReceived(this.onPeerCallReceived())
            .setOnPeerStreamReceived(this.onPeerStreamReceived())
            .setOnCallError(this.onPeerCallError())
            .setOnCallClose(this.onPeerCallClose())
            .build()

        this.currentStream = await this.media.getCamera()
        this.onCurrentStreamLoaded()

        this.addVideoStream(this.currentPeer.id)
    }

    addVideoStream(userId, stream = this.currentStream) {
        const recorderInstance = new Recorder(userId, stream)
        this.usersRecordings.set(recorderInstance.filename, recorderInstance)

        if (this.recordingEnabled) {
            recorderInstance.startRecording()
        }

        this.view.renderVideo({
            userId,
            stream,
            isCurrentId: false
        })
    }

    onUserConnected  () {
        return userId => {
            console.log('user connected!', userId)
            this.currentPeer.call(userId, this.currentStream)
        }
    }
    
    onUserDisconnected  () {
        return userId => {
            console.log('user disconnected!', userId)

            if (this.peers.has(userId)) {
                this.peers.get(userId).call.close()
                this.peers.delete(userId)
            }

            this.view.setParticipants(this.peers.size)
            this.view.removeVideoElement(userId)
        }
    }

    onPeerError () {
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

    _answerCall (call) {
        console.log('answering call', call)
        call.answer(this.currentStream)
    }

    onPeerCallReceived () {
        return call => {
            if (this.currentStream instanceof MediaStream) {
                this._answerCall(call)
            } else {
                console.log('waiting for stream to load')
                this.onCurrentStreamLoaded = () => this._answerCall(call)
            }
        }
    }

    onPeerStreamReceived () {
        return (call, stream) => {
            const callerId = call.peer
            console.log('caller id: ', callerId)
            console.log('stream: ', stream)
            this.addVideoStream(callerId, stream)
            this.peers.set(callerId, { call })
            this.view.setParticipants(this.peers.size)
        }
    }

    onPeerCallError () {
        return (call, error) => {
            console.log('an call error ocurred!', error)
            this.view.removeVideoElement(call.peer)
        }
    }

    onPeerCallClose () {
        return (call) => {
            console.log('call closed!', call.peer)
        }
    }

    onRecordPressed(recordingEnabled) {
        this.recordingEnabled = recordingEnabled
        console.log('pressionou!!', this.recordingEnabled)
        for (const [key, value] of this.usersRecordings) {
            if (this.recordingEnabled) {
                value.startRecording()
                continue
            }
            this.stopRecording(key)
        }
    }

    async stopRecording(userId) {
        const userRecordings = this.usersRecordings
        for (const [key, value] of userRecordings) {
            const isContextUser = key.includes(userId)
            if (!isContextUser) continue

            const rec = value
            const isRecordingActive = rec.recordingActive
            if (!isRecordingActive) continue

            await rec.stopRecording()

        }
    }

}