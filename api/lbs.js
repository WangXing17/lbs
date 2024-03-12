module.exports = (request, response) => {
    let responseData = {
        code: 10000,
        msg: "success",
        ip: "",
        country: ""
    };

    if (!request.query.ip) {
        responseData.code = 10001
        responseData.msg = "IP param lose"
        response.status(200).send(JSON.stringify(responseData));
        return;
    }

    let ip = request.query.ip;
    responseData.ip = ip
    // 校验 IP 地址格式
    if (!isValidIP(ip)) {
        responseData.code = 10001
        responseData.msg = "invalid IP address"
        response.status(200).send(JSON.stringify(responseData));
        return;
    }

    // 校验是否是保留ip
    if(isReservedIP(ip)) {
        responseData.code = 10001
        responseData.msg = "IP is reversed address"
        response.status(200).send(JSON.stringify(responseData));
        return;
    }

    response.msg = "success"
    responseData.country = findCountry(ip, ipRanges)
    response.status(200).send(JSON.stringify(responseData));
};

// 判断 IP 地址格式是否合法的辅助函数
function isValidIP(ip) {
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    return ipRegex.test(ip);
}

//判断 IP 地址是否为保留地址
function isReservedIP(ip) {
    // 将IPv4地址转换为字节数组
    let ipBytes = ip.split('.').map(Number);

    // 检查是否为IPv4地址
    if (ipBytes.length === 4) {
        switch (ipBytes[0]) {
            case 10:
                return true;
            case 100:
                return ipBytes[1] >= 64 && ipBytes[1] <= 127;
            case 127:
                return true;
            case 169:
                return ipBytes[1] === 254;
            case 172:
                return ipBytes[1] >= 16 && ipBytes[1] <= 31;
            case 192:
                switch (ipBytes[1]) {
                    case 0:
                        switch (ipBytes[2]) {
                            case 0:
                            case 2:
                                return true;
                        }
                        break;
                    case 18:
                    case 19:
                        return true;
                    case 51:
                        return ipBytes[2] === 100;
                    case 88:
                        return ipBytes[2] === 99;
                    case 168:
                        return true;
                }
                break;
            case 203:
                return ipBytes[1] === 0 && ipBytes[2] === 113;
            case 224:
            case 240:
                return true;
        }
    }
    return false;
}


const fs = require('fs');
const path = require('path');

// 从文件中读取IP范围数据
const filename = path.join(process.cwd(), 'ipv4.tsv');
const ipRanges = readIPRangesFromFile(filename);

// 读取并解析TSV文件
function readIPRangesFromFile(filename) {
    console.log("开始加载数据")

    const content = fs.readFileSync(filename, 'utf-8');
    const lines = content.split('\n');
    const ranges = [];

    // 解析每一行
    for (const line of lines) {
        if (line.trim() === '') continue; // 忽略空行
        const [start, end, country] = line.trim().split('\t');
        ranges.push([parseInt(start, 16), parseInt(end, 16), country]); // 将起始和结束值转换为十进制数
    }

    // 按起始值排序
    ranges.sort((a, b) => a[0] - b[0]);

    console.log("结束加载数据")
    return ranges;
}

// 通过二分法查找IP所属国家
function findCountry(ip, ranges) {
    // 将IP地址转换为数值
    const ipNumber = ipToNumber(ip);

    // 二分查找
    let low = 0;
    let high = ranges.length - 1;
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const [start, end, country] = ranges[mid];

        if (ipNumber >= start && ipNumber <= end) {
            return country;
        } else if (ipNumber < start) {
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    }

    return ""; // 如果IP不在任何范围内，则返回未知国家
}

// 辅助函数：将IP地址转换为数值
function ipToNumber(ip) {
    return ip.split('.').reduce((result, octet) => {
        return (result << 8) + parseInt(octet, 10);
    }, 0);
}