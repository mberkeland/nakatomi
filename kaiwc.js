// Customization Variables:
var server_url = "https://neru-ef3346a6-debug-nakatomi.use1.runtime.vonage.cloud";
var avatarimg = "https://vids.vonage.com/vapi4vonage/favicon.png";  // Point to the Avatar image
var title = "Where in the Ductwork Am I?";  // Title on the bot
var avatarbgcolor = "#F9A825";  // Avatar's Background Color
var avatarmargin = "0%";       // Avatar's margin
var headerbgcolor = "#F9A825";  // Header background color
var headertitlecolor = "#FFFFFF";  // Header title color
var bodybgcolor = "#9dbfde";    // Body color
var sendbuttoncolor = "#F9A825";  //  Send button color
var showwait = true;
var agent = "66cd668a5cd447cc0be1e526"

console.log("Server: ", server_url);
//
var keepalive = null;
const sender = {
    name: "bot",
    id: "00000000-0000-0000-0000-000000000001",
    avatar: avatarimg,
}
function ask(message) {
    wait();
    message = message.replace(/(<([^>]+)>)/ig, '');
    fetch(server_url + "/ask", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: id,
            text: message,
            agent: agent,
        })
    }).then(async (result) => {
        const chatBot = document.querySelector("chat-bot");
        chatBot.hideLastLoading();
        const body = await result.json();
        console.log("Answered!", body);
        if (body.answer) {
            chatBot.sendMessage(body.answer, {
                right: false,
                sender,
                continued: false,
            });
        }
    });
}
function wait() {
    if (!showwait) return;
    const chatBot = document.querySelector("chat-bot");
    chatBot.sendMessage('', {
        right: false,
        loading: true,
    });
}

var started = false;
var id;
class kaiwc extends HTMLElement {
    constructor() {
        super();
    }
    async connectedCallback() {
        const now = new Date();
        if (this.getAttribute("title")) title = this.getAttribute("title");
        if (this.getAttribute("avatarimg")) avatarimg = this.getAttribute("avatarimg");
        if (this.getAttribute("avatarbgcolor")) avatarbgcolor = this.getAttribute("avatarbgcolor");
        if (this.getAttribute("avatarmargin")) avatarmargin = this.getAttribute("avatarmargin");
        if (this.getAttribute("headerbgcolor")) headerbgcolor = this.getAttribute("headerbgcolor");
        if (this.getAttribute("headertitlecolor")) headertitlecolor = this.getAttribute("headertitlecolor");
        if (this.getAttribute("bodybgcolor")) bodybgcolor = this.getAttribute("bodybgcolor");
        if (this.getAttribute("sendbuttoncolor")) sendbuttoncolor = this.getAttribute("sendbuttoncolor");
        if (this.getAttribute("showwait")) showwait = (this.getAttribute("showwait") == "true") ? true : false;
        if (this.getAttribute("server_url")) server_url = this.getAttribute("server_url");
        if (this.getAttribute("agent")) agent = this.getAttribute("agent");
        sender.avatar = avatarimg;
        id = crypto.randomUUID();
        console.log("Created UUID: ", id, avatarimg);
        var s = document.createElement("script");
        s.type = "text/javascript";
        s.src = "https://cdn.jsdelivr.net/npm/wc-chatbot@0.2.0";
        document.head.append(s);
        this.innerHTML = '<chat-bot title="' + title + '"></chat-bot>';
        this.init();
        document.querySelector('chat-bot').addEventListener("click", (event) => { this.showBot() });
    }
    async init() {
        console.log("Init");
        var styles = "chat-bot {";
        if (avatarimg) styles += `--chatbot-avatar-img: url('${avatarimg}');`;
        if (avatarbgcolor) styles += `--chatbot-avatar-bg-color:${avatarbgcolor};`;
        if (avatarmargin) styles += `--chatbot-avatar-margin:${avatarmargin};`;
        if (headerbgcolor) styles += `--chatbot-header-bg-color:${headerbgcolor};`;
        if (headertitlecolor) styles += `--chatbot-header-title-color:${headertitlecolor};`;
        if (bodybgcolor) styles += `--chatbot-body-bg-color:${bodybgcolor};`;
        if (sendbuttoncolor) styles += `--chatbot-send-button-color:${sendbuttoncolor};`;
        styles += "}";
        var styleSheet = document.createElement("style")
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet)
        const chatBot = document.querySelector('chat-bot');
        chatBot.addEventListener("sent", async function (e) {
            console.log(
                "A message is sent:",
                e.detail.message
            );
            if (id && e.detail.message.right && !e.detail.message.loading) {
                await ask(e.detail.message.message);
            }
            if (e.detail.message.loading) {
                console.log("Clearing wait")
                e.detail.message.message = "Here it is!";
            }
        });
    }
    async showBot() {
        console.log("Started? ", started)
        const wrapper = document.querySelector('chat-bot').shadowRoot.querySelector('.chatbot-container')
        console.log("chatbot hidden? ", wrapper.classList.contains('animation-scale-out'));
        if (!started) {
            started = true;
            id = crypto.randomUUID();
            await ask("");
            keepalive = setInterval(() => {
                fetch(server_url + "/keepalive");
                console.log("Keptalive!")
            }, 60 * 1000);
        }
    }
    sendMsg(f) {
        console.log("sendMsg", sender)
        if (f.bm.value !== "") {
            doSendMsg(f.bm.value);
        }
        return false;
    }
    doSendMsg(m, options = { right: false, sender, loading: false }) {
        console.log("doSendMessage", sender)
        const chatBot = document.querySelector("chat-bot");
        if (chatBot) {
            chatBot.sendMessage(m, options);
        }
    }
}
customElements.define('kai-wc', kaiwc);
