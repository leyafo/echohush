function timeAgo(strTime){
    const timestamp = Date.parse(strTime)
    return unixTimeAgo(timestamp/1000)
}

function unixTimeAgo(unixTimestamp) {
    const currentTime = Math.floor(Date.now() / 1000); // Convert to Unix timestamp
    const timeDifference = currentTime - unixTimestamp;

    if (timeDifference < 30) {
        return `just now`;
    }
    if (timeDifference < 60) {
        return `${timeDifference} seconds ago`;
    }

    const minutes = Math.floor(timeDifference / 60);
    if (minutes < 60) {
        return `${minutes} minutes ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours} hours ago`;
    }

    const days = Math.floor(hours / 24);
    if (days < 30) {
        return `${days} days ago`;
    }

    const months = Math.floor(days / 30);
    if (months < 12) {
        return `${months} months ago`;
    }

    const years = Math.floor(days / 365);
    return `${years} years ago`;
}

function unixTimeFormat(unixTime) {
    const d = new Date(unixTime * 1000);
    let minute = d.getMinutes();
    minute = minute < 10 ? '0'+ minute : minute; 
    let second = d.getSeconds()
    second = second < 10 ? '0'+second : second;
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getUTCDate()} ${d.getHours()}:${minute}:${second}`;
}

export{
    timeAgo,
    unixTimeAgo,
    unixTimeFormat,
}
