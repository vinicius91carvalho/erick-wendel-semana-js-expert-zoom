class View {
    constructor() {
        this.recorderBtn = document.getElementById("record")

    }

    renderVideo({ muted = true, userId, stream = null, url = null, isCurrentId = false }) {
        const video = this.createVideoElement({ 
            muted, 
            srcURL: url, 
            srcStream: stream
        })
        this.appendToHTMLTree(userId, video, isCurrentId)
    }

    createVideoElement({ muted = true, srcURL, srcStream }) {
        const video = document.createElement('video')
        video.muted = muted
        video.src = srcURL
        video.srcObject = srcStream

        if (srcURL) {
            video.controls = true
            video.loop = true
            Util.sleep(200).then(_ => video.play())
        }

        if (srcStream) {
            video.addEventListener("loadedmetadata", _ => video.play())
        }

        return video
    }

    appendToHTMLTree(userId, video, isCurrentId) {
        const div = document.createElement('div')
        div.id = userId
        div.classList.add('wrapper')
        div.append(video)

        const div2 = document.createElement('div')
        div2.innerText = isCurrentId ? '' : userId
        div.append(div2)

        const videoGrid = document.getElementById('video-grid')
        videoGrid.append(div)

    }

    setParticipants(count) {
        const myself = 1
        const participants = document.getElementById('participants')
        participants.innerHTML = (count + myself)
    }

    removeVideoElement(id) {
        const element = document.getElementById(id)
        element.remove()
    }

    toggleRecordingButtonColor(isActive = true) {
        this.recorderBtn.style.color = isActive ? 'red' : 'white'
    }

    onRecordClick (command) {
        this.recordingEnabled = false
        return () => {
          const isActive = this.recordingEnabled = !this.recordingEnabled
          command(isActive)
          this.toggleRecordingButtonColor(isActive)
        }
      }

    configureRecordButton(command) {
        this.recorderBtn.addEventListener('click', this.onRecordClick(command))
    }
}