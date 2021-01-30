class View {
    constructor() {

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
}