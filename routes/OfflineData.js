/**
 * Created by simone on 14/03/19.
 */

exports.data = function(){
    var data = {};
    data['roles'] = {
        1 : 'Administrator',
        2 : 'Data Manager',
        3 : 'Tech',
        4 : 'Forensic',
        5 : 'Police Officer',
        6 : 'Company',
        7 : 'IoT-SP Operator'
    };
    data['users'] = [
        {
            'nickname': 'System Administrator',
            'username': 'admin@cybertrust.com',
            'password': 'admin',
            'role': '1'
        },
        {
            'nickname': 'ISP Administrator',
            'username': 'isp@cybertrust.com',
            'password': 'isp',
            'role': '2'
        },
        {
            'nickname': 'Law Enforce Agency',
            'username': 'lea@cybertrust.com',
            'password': 'lea',
            'role': '3'
        },
        {
            'nickname': 'Smart home owner',
            'username': 'owner@cybertrust.com',
            'password': 'owner',
            'role': '4'
        },
        {
            'nickname': 'IoT Service Provider',
            'username': 'iot@cybertrust.com',
            'password': 'iot',
            'role': '5'
        },
        {
            'nickname': 'Smart Decice Security Company',
            'username': 'sds@cybertrust.com',
            'password': 'sds',
            'role': '6'
        },
        {
            'nickname': 'Smart Decice Manifacturer',
            'username': 'sdm@cybertrust.com',
            'password': 'sdm',
            'role': '7'
        }
    ];
    data['device']=[{

          id                  : 'CT001',
            mac                 : '00-14-22-01-23-45',
            device              : 'iot-0034_smartMeter',
            interface           : 'Wi-Fi',
            trust_level         : 32,
            event_remediation    : 'Attacked/Disconnected',
            ct                  : 'Yes'
        },
        {
            id                  : 'CT002',
            mac                 : '00-24-23-11-21-53',
            device              : 'router_hc00981',
            interface           : 'Wi-Fi',
            trust_level         : 100,
            event_remediation    : 'Attacked/Disconnected',
            ct                  : 'Yes'
        },
        {
            id                  : 'CT003',
            mac                 : '12-10-52-51-11-75',
            device              : 'iot-1049_smartMeter',
            interface           : 'Wi-Fi',
            trust_level         : 32,
            event_remediation    : 'Attacked/Disconnected',
            ct                  : 'Yes'
        },
        {
            id                  : 'CT004',
            mac                 : '00-65-08-02-32-46',
            device              : 'iot-heath_control',
            interface           : 'Bluetooth',
            trust_level         : 32,
            event_remediation    : 'Attacked/Disconnected',
            ct                  : 'No'
        },
        {
            id                  : 'CT005',
            mac                 : '00-14-22-01-23-45',
            device              : 'iot-0034_smartMeter',
            interface           : 'Wi-Fi',
            trust_level         : 65    ,
            event_remediation    : 'Attacked/Disconnected',
            ct                  : 'No'
        },
        {
            id                  : 'CT006',
            mac                 : '00-14-22-01-23-45',
            device              : 'iot-0034_smartMeter',
            interface           : 'Wi-Fi',
            trust_level         : 32,
            event_remediation    : 'Attacked/Disconnected',
            ct                  : 'Yes'
        },
        {
            id                  : 'CT007',
            mac                 : '00-14-22-01-23-45',
            device              : 'iot-0034_smartMeter',
            interface           : 'Wi-Fi',
            trust_level         : 65,
            event_remediation    : 'Attacked/Disconnected',
            ct                  : 'Yes'
        },
        {
            id                  : 'CT008',
            mac                 : '00-14-22-01-23-45',
            device              : 'iot-0034_smartMeter',
            interface           : 'Wi-Fi',
            trust_level         : 100,
            event_remediation    : 'Attacked/Disconnected',
            ct                  : 'Yes'
        },
        {
            id                  : 'CT009',
            mac                 : '00-11-22-23-06-01',
            device              : 'iot-0041_smartMeter',
            interface           : 'Cable',
            trust_level         : 32,
            event_remediation    : 'Attacked/Disconnected',
            ct                  : 'No'
        },
        {
            id                  : 'CT010',
            mac                 : '00-23-00-27-55-87',
            device              : 'Wi-Fi_HOTSPOT_0021',
            interface           : 'Wi-Fi/Bluetooth',
            trust_level         : 100,
            event_remediation   : 'Attacked/Disconnected',
            ct                  : 'Yes'
        }
    ];
    data['company'] = [
        {
            name        : "Mathema S.R.L.",
            address     : "via Torcicoda"
        }
    ];
    return data;
};
exports.mock = function(){
    var data = {
        /*users   : [
            {
                _id     : 1,
                firstname: 'Simone',
                lastname: 'Naldini',
                email: 'simone.naldini@mathema.com',
                roles: ['ISP'],
                telephone: '1234567890',
                username : 'user_01-CT',
                password : 'abcdefghilmnopq'
            },
            {
                _id     : 2,
                firstname: 'Stefano',
                lastname: 'Cuomo',
                email: 'stefano@mathema.com',
                roles: ['Admin'],
                telephone: '1234567890',
                username : 'user_01-CT',
                password : 'abcdefghilmnopq'
            },
            {
                _id     : 3,
                firstname: 'Filippo',
                lastname: 'Alaimo',
                email: 'filippo@mathema.com',
                roles: ['Admin'],
                telephone: '1234567890',
                username : 'user_01-CT',
                password : 'abcdefghilmnopq'
            },
            {
                _id     : 4,
                firstname: 'Andrea',
                lastname: 'Lombardi',
                email: 'andylo@mathema.com',
                roles: ['ISP'],
                telephone: '1234567890',
                username : 'user_01-CT',
                password : 'abcdefghilmnopq'
            },
            {
                _id     : 5,
                firstname: 'Laura',
                lastname: 'Piazzini',
                email: 'laura@mathema.com',
                roles: ['Home Owner'],
                telephone: '1234567890',
                username : 'user_01-CT',
                password : 'abcdefghilmnopq'
            },

            {
                _id     : 6,
                firstname: 'WooJeon',
                lastname: 'Park',
                email: 'wj@mathema.com',
                roles: ['LEA'],
                telephone: '1234567890',
                username : 'user_01-CT',
                password : 'abcdefghilmnopq'
            }
        ],
            */
        users   : [
            {
                _id     : 1,
                firstname: 'xxxxxxxxxx',
                lastname: 'xxxxxxxxxx',
                email: 'xxxxxxxxxx@yyyyyy.com',
                roles: ['ISP'],
                telephone: '1234567890',
                username : 'user_01-CT',
                password : 'abcdefghilmnopq'
            },
            {
                _id     : 2,
                firstname: 'xxxxxxxxxx',
                lastname: 'xxxxxxxxxx',
                email: 'xxxxxxxxxx@yyyyyy.com',
                roles: ['Admin'],
                telephone: '1234567890',
                username : 'user_01-CT',
                password : 'abcdefghilmnopq'
            },
            {
                _id     : 3,
                firstname: 'xxxxxxxxxx',
                lastname: 'xxxxxxxxxx',
                email: 'xxxxxxxxxx@yyyyyy.com',
                roles: ['Admin'],
                telephone: '1234567890',
                username : 'user_01-CT',
                password : 'abcdefghilmnopq'
            },
            {
                _id     : 4,
                firstname: 'xxxxxxxxxx',
                lastname: 'xxxxxxxxxx',
                email: 'xxxxxxxxxx@yyyyyy.com',
                roles: ['ISP'],
                telephone: '1234567890',
                username : 'user_01-CT',
                password : 'abcdefghilmnopq'
            },
            {
                _id     : 6,
                firstname: 'xxxxxxxxxx',
                lastname: 'xxxxxxxxxx',
                email: 'xxxxxxxxxx@yyyyyy.com',
                roles: ['LEA'],
                telephone: '1234567890',
                username : 'user_01-CT',
                password : 'abcdefghilmnopq'
            }
        ],
        devices : [
            {
                _id                         : 1,
                description                 : 'Davolink dv2 200',
                type                        : 'Router',
                user                        : 'ctUser00982',
                device_info                 :{
                    OS  :   {
                        os_name     : 'None',
                        sdk         : '1.02',
                        version     : '0.987'
                    },
                    manufacturer: 'Davolink',
                    model: 'dv2 200'
                },
                vulnerability   : 60,
                trust           : 85,
                CPE             : 'AX12340swso',
                patch           :{
                    patching_status : true,
                    version         : '3.4.34',
                    timestamp       : '2019/12/27'
                }

            },
            {
                _id                         : 2,
                description                 : 'Linksys Wireless Routers',
                type                        : 'Router',
                user                        : 'ctUser77262',
                device_info                 :{
                        OS  :   {
                            os_name     : 'None',
                            sdk         : '1.02',
                            version     : '0.987'
                        },
                        manufacturer: 'Linksys',
                        model: 'WRT1200AC'
                },
                vulnerability   : 85,
                trust           : 85,
                CPE             : 'AX12340swso',
                patch           :{
                    patching_status : true,
                    version         : '3.4.34',
                    timestamp       : '2019/12/27'
                }
            },
            {
                _id                         : 3,
                description                 : 'Linksys E1500/E2500',
                type                        : 'Router',
                user                        : 'ctUser77262',
                device_info                 :{
                    OS  :   {
                        os_name     : 'None',
                        sdk         : '1.02',
                        version     : '0.987'
                    },
                    manufacturer: 'Linksys',
                    model: 'E15xx/E25xx'
                },
                vulnerability   : 35,
                trust           : 75,
                CPE             : 'AX12340swso',
                patch           :{
                    patching_status : false,
                    version         : '3.4.34',
                    timestamp       : '2019/12/27'
                }
            },
            {
                _id                         : 4,
                description                 : 'Netgear DGN',
                type                        : 'Router',
                user                        : 'ctUser00562',
                device_info                 :{
                    OS  :   {
                        os_name     : 'None',
                        sdk         : '1.02',
                        version     : '0.987'
                    },
                    manufacturer: 'Netgear',
                    model: 'DNG1xxx'
                },
                vulnerability   : 35,
                trust           : 45,
                CPE             : 'AX12340swso',
                patch           :{
                    patching_status : false,
                    version         : '3.4.34',
                    timestamp       : '2019/12/27'
                }
            }
        ],
        alerts  : [
            {
                device      : 1,
                deviceType  : 'Router',
                user        : 'ctUser00982',
                reason      :   {
                    rule_id:'alr00982'
                },
                metadata    : {
                    cpu_usage   : 80,
                    ext_stor    : 73,
                    int_stor    : 23,
                    mem_usage   : 67
                },
                _insertedTimestamp : '2019/12/08',
                timesTamp : '2019/12/08'
            }
        ]
    }
    return data;
}