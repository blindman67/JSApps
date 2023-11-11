"use strict";
const customCursors = (()=>{
    const cursors ={
        encoding:"url('data:image/png;base64,",
        directions: "N,NNE,NE,ENE,E,ESE,SE,SSE,S,SSW,SW,WSW,W,WNW,NW,NNW".split(","),
        directionsShort: "N,NE,E,SE,S,SW,W,NW".split(","),
        getAngleName(angle, cursor) {
            angle = angle % (Math.PI2);
            if (angle < 0) { angle += Math.PI2 }
            angle = (Math.round((angle / (Math.PI2)) * cursor.directionSetCount) + cursor.direction) % cursor.directionSetCount;
            if(cursor.directionSetCount === 8){
                return  customCursors.cursors.directionsShort[angle];
            }
            return customCursors.cursors.directions[angle];
        },
        nativeCursors : {
            resize_N : { direction : 0, directionSetCount :  8 , name : "n-resize" },
            resize_NE : { direction : 1, directionSetCount :  8 , name : "ne-resize" },
            resize_E : { direction : 2, directionSetCount :  8 , name : "e-resize" },
            resize_SE : { direction : 3, directionSetCount :  8 , name : "se-resize" },
            resize_S : { direction : 4, directionSetCount :  8 , name : "s-resize" },
            resize_SW : { direction : 5, directionSetCount :  8 , name : "sw-resize" },
            resize_W : { direction : 6, directionSetCount :  8 , name : "w-resize" },
            resize_NW : { direction : 7, directionSetCount :  8 , name : "nw-resize" },
        },
        pointer_Add : {
            center : " 7 2,",
            image :  "iVBORw0KGgoAAAANSUhEUgAAAB4AAAAdCAYAAAC9pNwMAAABV0lEQVRIibWWsYrDMAyGv3fwelOXLBk6HHi76ZZAhkIphR6UcO//Dr0hMnVVJZEd3w+iUMf6ZMmWDe31EAv/4HsZmiTwQ5UTnpF7o9fgWArXDnqHg2DMG2WuO+3awbAS/SM3NS83F1w7uGXRm99tCWfN9YQJOAGfO8GbNbfAZwUOkgFvqm/MJVut+ZKDaIAHcToZ837l/6kKvBBEYE5bZK7/yfj2DlxlbKQ01RtBdLKKaIxfgW8Z8xxJHzgDdMBHgvO6IaOMlR8n5+p7sZG5nvkRLG8gSzLAETjK78B603mCeO3Lm2AdRLa6VPPNmlopqwGnBhNwXiyLKSwEpwbjrmdxaluCi9PbApzU1cL3gqvhLcBVcN53dbVKoT9UdClL7p0u4AvwReWrUssLTT35SKO3dOD9FWG9KtIN1GS1SfqiP2eWX+5dS2gO75l3rDbX5b5HYcWq9Af3fuUN358uqQAAAABJRU5ErkJggg==')",
        },
        rotate_NE : {
            direction: 1,
            directionSetCount: 8,
            center : " 25 15,",
            image : "iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAYAAACoYAD2AAAB2UlEQVRYR+2Y246DMAxEQeL2/1/L5aGtEUaOa8dOSgIrLW9tQT2Z2DMObZN4vT4XPNJ+rsRHs293/xGB2/8MWGuBmpAK3DMgJTjcL9jp25UEQCy5owSDeroVkqonwXEl4fOyLM04jkXr86xJSz0qpdTYuKgSzbRDImBMPc0/tm1r+r4HJc+uv9qi2l8AJXAKe5WqPyupKYzNxX/PAb+kJg0HCDhzrCsw85zuPuovqEftO6jfYRiSPVZMHN7p2ByamXPjh/vWdQ0aCqM0B1SNxZzE4TvB6xI/p4Jemt0ACXYEEBQQmkVbgKeRTEjcYs8URO1Mik7rd9UpUoe82DwpQaCxV1HSsxiEpE1D7Ymou3e4N5nc2+2BpBFrdTcpI3M4uRxSAqXWhVak2ZkYtV6FUu+jXgvPdl331fVo+lYKFVGSOwJdoJTp1hBdFFJSX5q6/gSkte3VlaSNhTaEMTnPczNN0xfTIyAfoSSmTayBYkNycSW5FVFQnkZKozXVIHMOeWfXp5p0zv05hz1qS8WVlLrZs9DqkLE8F7OavWuqomSqmjyBqkF6QaWI/If0DhjWbFlVSTrCacfdIyIDrsdBSkfcWyB5Ez1unmTZvb/2vvX44EmWIzKjO/oGf4cOQGF8rYgAAAAASUVORK5CYII=')"
        },
        rotate_SE : {
            direction: 3,
            directionSetCount: 8,
            center : " 25 25,",
            image : "iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAYAAACoYAD2AAAB4UlEQVRYR+2YyY6EMAxE0xLb/38ty2EGI4yM8RYgMCM1l5ZolpeKK+XwSS8fP/PxmQ8Lw/yzNP8KmObfZIG+BskATdBXICkgzhbMuKboF1KqaUlFT81HlbQALdAvJJ3uiIqamo8piZDjOKa6rs0lmDv9EcgcFSU1v5CgyhkVD2o+lc/Kmrmd1nqMJYVKQ6Ka/D1oDq6acJ3dIpUawL/M7mmaUtM0qe/71HXdYXYfme7Iov6nuqDcqYYBFlUSgDzDLBBGL1kUEhVDyKqqEtSe5urHtw9aTuNaSAX2VCyiJAekizTAoZNRYW8TdjukBKiotuxn1np0feFewAsfzSDVkLQDRBByH2643K3slkbRVKEvWaPusFf2tqne/xqLq6QCJ6oA10JDy10MqhdRUoKTGlKeJmzd22qPnkfzREyjGoeucehI2vLzZYMPCB6M2wTN3VHAAySfErVG1oSgymKdWudyFTwYh6tnGYo3qEL60ajbPSpHwR2kFPpR10fVJgq7ZuXPXFzH8/QKII0+77tj9D3LqK6AQp2BqXgu3wW4M86VmqSmuRNOTJwz7h6GIbVta36pjU5rVuJ4qkbaq6tg9H7VaWcS506wECRelJPdr0E6sNlr3pmBZL/E6ifPAETu+QU2Xw5Az9rE1QAAAABJRU5ErkJggg==')"
        },
        rotate_NW : {
            direction: 7,
            directionSetCount: 8,
            center : " 15 15,",
            image : "iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAYAAACoYAD2AAAB20lEQVRYR9WX2Y6EQAhF9cHl/7+2XZKexkgFaagCR0rbl8nEhdMXuFBtU/F6fy4I134uT1jXw54P82cBENl2VjNsdUgA9MLeAokqW2FvhZRgpXoNhYQ6nKapGYZh4wHlsB6l+qb3KWwIJOniL5YcJP4Q+LvX7sZ3KSSHg0DLsjRd17mNAVUFRS+DlCzGTcZeSKBnPoSK0XdL9eaN8y8lqWIYGL1PqjeerPCaRMB5ng91xv2ONwC1mtDu5oBUIWyQvu9TVvnow/cpJDYV/ZGnfVICpMFI/SQf5MEkyEsnDg3ADZfaDoCD3YBCOUgrXCoTS9dJkBSidH8359gtyKMktQ5pXQvbJ3lKuSfi/5BmaB460iyZKj1TnDjcF9F+tO6+GrA4uy0dCR+JUtDUOBokdvG6rgdfvHIXOIxcrR4kQJwkyvgrlk6p9rT76odzKkYp5oIsqfgIyNfr9R7HsaGLRM7/zqbR+p6Y7ielOlkQmnVuidWW2hqpb7lZU1C+6UjpiTBvHidB5pZRtev2I2q0mltNat2cK+yajfQ7kB41o+e0lL1kQZ6U10z11xZkAa0N+JuQpdq8Q0V16X3kWJQOTNo5Jtq4s92dA70rze7jwx0KmiBJI4UdDSw75R8o6xFEUVHiwQAAAABJRU5ErkJggg==')"
        },
        rotate_SW : {
            direction: 5,
            directionSetCount: 8,
            center : " 15 25,",
            image : "iVBORw0KGgoAAAANSUhEUgAAACkAAAApCAYAAACoYAD2AAAB8klEQVRYR92Y23KDMAxEzQPw/5/LZabFDPIsi4xsgu2mvCQNTn1YaSU5nTOun+3qtstaV/L+7eYHoNteXUvQKCQBNgVVIRFQwugj3krR74TUVGyt5knJO8CWoN8FySoeJgnlD/+ubaKgpAbpCQVI3uNntWrnDqnloijHry1y04QUKA5/zZB3KY6O9eVaoAFSA/HqYXhja0rnZgg3A6Bh2EC4tjTgvndEHT+e7b26hVEugv0ryBb1MUQx5ty/NK4lDb1klFOuQs4WO2IkHx/YQH3fu3VdubcXAX0EebTSALgsixuGodjkbj655KYQzfPsvIp4gPSlqiSoCSkDCLlbraGlQJMhoU8HQN9tvNLaA2idCNYm7WuWIHS0dby17ks0JEWkk6W21KQn0iAO9S5K+nz1YWcA/h9oPgs2CxJNE+nrp1SIRYMnK0vZJEgMl+VuAeCNraOyKKupmgypgcYUESNxPeXJ6jLtwOSFsFmQbABULQbAP8iJwqD0iRXNJaDZkFg3U3q6NsDweUlbg0eTR5CRjfdBmUOsrSVnx5aE4/RrkNyZcmC132iLKMnlBs1D905qM+BrORmND93wZWeaJjeO436nmrtTAXldtTr5FBBLl3aWf63jfALIkLmDxqvuvnsQHJ4t5S6d6FOFcr7/dJ78BT9VMkQQsPUZAAAAAElFTkSuQmCC')"
        },
        drag : {
            center : " 26 26,",
            image : "iVBORw0KGgoAAAANSUhEUgAAADUAAAA1CAYAAADh5qNwAAADn0lEQVRoQ91aPY/bMAyV26FAc5cGlyFAM7Rb5nbokP+PDB3aOVu7BMiQQ5q7K3BDPyzXtGmZIilLitN4aC+xLPGJ5OOjnMJkvv6UV1EUzSrlR1N+br/IsH7WyQGQBQKXxZMbWDZQFKBzAUsOyoKxxoNHfNGV02NJQWkB5fZYMlAA6O1iYXb7vTr9c3gsGlSdOwWXQxLC1MCiQVmDYwDlCMVoUMMBWT7pLp/KYyOC6gfl7PbWHB8eqhsxBToZKNdEXHA5Wvc9NzooymhtnWIAD97wwQ8SO9xqoWsqvgBUQx7YkzGhRkaJVEOG3A8BlRpQRTIao0EtSKzkjKvUuKT9UJ3y2qJdv5lLAoUn5EDZccvl0ux2O2gtVKCgteLaEa0NKlAQRm9ubsyPx0dvH2THLUrNt0eaL5T9uMKrtUME5eaFb1E7brVame122zgd775UozQNpNYWFhSV6BQoO24+n5vD4dDYPp1Ozel0CumnOmHqW8f1POfZXnL6mAtPAjG+Xq/NZrNpAN1NJub+6Qlkjiqn6jwlgUEOa2zCEdEBxVGxlCOf3t2Zz9/vOyFYJ38vAuF7KvS0bIlYs5frDSgS0HO5669eN8wfcgjUMfz3V2NefFABtoNms5k5Ho8dfO0GlGXi+Wdp14Sar8JT/eP1UAWqfVii/04I1KdGEF5wD4yTPM+uRdiF04PvWAeCciSQky/vy8/fVHnnBeaxqwFWOyrECeJYtGskWUj3xQWYAXZuG35uwY6Zs+MBV7TCQv8vqF9fTPHyo99TzP2YXa08xdH40Mn5nPp37AwEgml96Ho9er9K9kNUW72d4HbuXHWK8phkV10X2zqlASYBvkhFAWFo/6eOjl0BaXMxt/azXbHLmNiL2E7cQZOClkrisVS6D5RbLjpqxhO/vdcxY/VTFCgOUOUQjkaB7lHOkSendtw5Ol/JjobafaBqQE1Mo1pAboQdf84zCrCPsl91mqQtilhvSWxJdLLJbEk2EQauUSlcO67dRN+40UHVTJvUjmSTuVJfG364vsR6SCQK7QK+vkULyhtCIZrMmSTaUy7tY9qVNoayGyn4wbYNflCjFyVQ7v2Le5MY3hdd8DtfEMJkDlEHJPY7uJhjrlAvi9ovZEKsPCRyYEgh6Y+wonMK55b9+yp+8eIqibqYsh000pFJPZSsTrkhxTV1nbjP+Lu/ZOFHgfPlWE7dV0VKCCmEjqWEbW5A2UFhusdKI4fewxv+F99DyFgAubWRAAAAAElFTkSuQmCC')"
        },
        drag_small : {
            center : " 25 25,",
            image : "iVBORw0KGgoAAAANSUhEUgAAADMAAAAzCAYAAAA6oTAqAAACQElEQVRoQ+2azW7DIAyAYZdJW6vlVmmnvcLe/yH2CjtN6i1Tu0m9rIMsJIYChmCvCWkuqZSA/fkPQyoF83VWl5RSqJtQd8kpjnVyB4QdiA0GghhvcHuIBcYH8h9A5DAxEG4gUhgN8rzbiY/9Hs1zjpAjg0nxiEtIDUQCMwWEI+SKYfJBzorDFkvloSvAXKZTs92K9nAoXlTJYFwV9YofunyNAEWHQALjU9qETijpA2OK9CkaHLJ8NYumBrzBoMss/sK6wkyHDLRJyp6EKsxyZUc9Y5R62mzE5/GYvB+hhNFVMVV+EMZVKGeVpoYxwYHp4IUp3VhxwehwjwFdwIQUwawC84oTJgZkwaQogRfIvzcA/DCkb1m63Eu9sE4CFqQBxgty+hLi/mHocnMOVyzFf96EuHv1AkKopmlE27YW5wiuDHD6Vvo8Ds/daOlggh7pYMbBqdaEnon9zpmve9ejDwSS0f3IRBgYGqOwF2W0dysEKWCskO4dkz1vbADMF9PaQ6OF8qBECT1ndZ6pJ2eMa6upZlGg/mFunF91ncGAFtcBxIDmApPVm4WA5gCD6bCO/Qz0EFzMFrvTnLoip3TfKUbJlb+uA41c60S7cPUQS+Ip8syYm2eg9dzjoMFK/edy19KxTqI0j4o9Y5LdVXqxXwFy+zYXfHbfZ9IPKWb85QyrXlh1oqxuxTmDdduJ22sSPUgmgUBV/A8gx0OUoWX1jVhMT3leVW8WKgpcHmFtZ3whxw2iZZIWAF9IOod/rPJ+AQ3iOFgpekFcAAAAAElFTkSuQmCC')"
        },
        drag_small_copy : {
            center : " 25 25,",
            image : "iVBORw0KGgoAAAANSUhEUgAAADMAAAAzCAYAAAA6oTAqAAACyklEQVRoQ+2azU7DMAzHUy5IwERvkzjxCrz/Q/AKnJB2K9pA2oXRVE2WuHbsJM7Ypu0ytrSJf/HXPx2dafw6jK+u68z4Zsb3ruVyTScHIM2BmsGEIM4brT3UBAYDOQWQOkwKpDWQKowFeVmvzedmw+Z5i5BTg5F4BBJqA6nAlIC0CLlqmHyQw8gRL6vloX+AWaZTv1qZYbutbqpqMNBE2/GpFyYENBRCFYwNMbZsZV5QI3mKYVyuOFvdzmLf22tCb7g9CHNFQ8MVwTBSZdJgSLXy3wcQXq+dBYwLCxdyzlAJjPPY7NVqIVrtmTDGOY/BkLSfNTziN47LT5jk1njMgBzPzB6ZNjIFg62dsjfpGbfQ89OT+drt0PhOhRMRRlE4cTA2bOH6ZMmnBmDIwC5dUs2w3JDAYNUPsxv1DBP7/p4wDGDupBombJDzegtbpHaQOYNNAMKFLRrUHFrzUFouMkxiBFcwsBwCVSzqQ9x8sNQj83uGKGQWN+6/jbl/sP17miPn4UqYH+b33Zi7t+l+9z0G0fe9GYYhGjo24LER739Gex79OPTQojxGM00wx5u5XQzHw42h/s6Zb7oWsScEinrGYvJCGMz4rnsdvfLhPRxKHjEUYY8HGieCvUk8t6BiUdorK28kBlmgq/NMJCkuOmeCsumfCXugS6xmSaB5kKr3krw5eZ/hgHKeoEiar+R4nKtGqrQZ5ZWWMKlNJXUWp5pT5bIVDBcdRecZru5rw1SfZ8IcAjLlpKo5Z23WMM4L2LiWZ3LXvsFwO3bzDLdDgvHqMKMkN3dCxGyTNNIUkwoM9VQ/JXXgGHzIIXDE4hI1mKLD1mzO2f0+I4c541/O7OamqhcXLpxE4e6PmmrOxaV6THBMqA53u4bKJKH0uYr/A+DOQ0BjVf8Wg5Z2rTAL57kqBUAVBc1kP5lnsJBrDaJeALjjQK1c4VLiD2iOt1gstXxDAAAAAElFTkSuQmCC')"
        },
        rotate_E : {
            direction: 2,
            directionSetCount: 8,
            center : " 13 22,",
            image : "iVBORw0KGgoAAAANSUhEUgAAABQAAAAtCAYAAACu/EtoAAABfElEQVRIS9WXTRKCMAyFy7DiFp7B+9/BK3gMNqg0kMwjJG2Ajo7dIIx8zc9LUro0r/e88hVXNy/9LHLfZZj1rrFHimwiQA2IbGJt4AIt9/Qm2QgNpTix22zlNE2p7/tiyDK8GdCDZQtMC0umlWACtNz2Ymi5uZEb3+g4WsBxHNMwDGbs+P8i3ghQXnISEnKZY6aqyLVyU17aSkgAASJQF4jZtMJR1KFOzJp1qYLTQOw8uqSi0HCL+g8g6Qz6LmcewxNyGZuwyOf1SF1/p3xiOVaBljZBFfQTJVQE7mG32Zqn6BurSKClVoVAQ+ibbn8auLpIMOXuEsufWbhYczGGVid3dCjSqcoGoaw5CtNZHWInalYpluta0LxxyOVLQNBXcTyELNRNgLtItBfSJijsSqltBtWhmQJ9jvV1fOp5g/70XP7ayQFj3PxsUzvKSZZbuesCa0fiwyfYGtCrEnp+1F1VCPuvgJL+9HgwjnS75tL+S4pbk7Ym8hlmDbgPhV40ONcEMdUAAAAASUVORK5CYII=')"
        },
        rotate_S : {
            direction: 4,
            directionSetCount: 8,
            center : " 22 13,",
            image : "iVBORw0KGgoAAAANSUhEUgAAAC0AAAAUCAYAAAAZb7T/AAABmUlEQVRIS82WQRKDIAxFYdzoLXqG3v8MPUNvoRunBSWZT0wAqZ2WDS0CeSQ/Ae9Ce4UW+9h8aPT7X3rJ5+MAcgL/Tw8gQNl/kY+hCdY6wLejgJDJVgZKYyo0SkIq5eooWN5Mkj2oM/JUoeUqGYVP9F+SpZVLJvS6rtuaYRjMPOTFHyQtQWP0pEHJwnapetBArWJcAUw2WsChqu3SoPC2Lm4BlglVS+Ae21tNblnYCqwphjxkRfGs/WZoLDma90qGrQNTVFqkiXucgsb6KRMIDWu1XgOjeaVkNDVtSSRuOs+zG8dRrZmQUDFBUqLcQv/k+d7v/8FTh0sDN1+WxU3TtO2lAW+OszIZjdQ8IefGBE9yyW7ckzJgcCkvFRon4SVgwWsHJHDMhRI0SgUOTWWOy53q6SSV7LGECYOSyMK3Ppwf7rz5wdPwHdfJ/agMo2QlU/YMBTj1eVp8ebGmd20remSvGQcv2sTDdL+dtVdZ6aVoVI8u+12LtEuip05bl01t/DJoqUE0XLsRa5Dy+6XQBH4wot3tZ0lh/hsjtNMQNXVOtAAAAABJRU5ErkJggg==')"
        },
        add : {
            center : " 2 2,  ",
            image : "iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAKElEQVQIW2NkAIL/QMDIyAiiGYA0IyNIACQBEwSzQQpBDGSAUyWGmQAurxz9lP1GCQAAAABJRU5ErkJggg==')"
        },
        rotate_N : {
            direction: 0,
            directionSetCount: 8,
            center : " 22 6, ",
            image : "iVBORw0KGgoAAAANSUhEUgAAAC0AAAAUCAYAAAAZb7T/AAABhUlEQVRIS72WQRLCMAhF0+mmvYVn8P5n8Azeot10tIkh8yVAaMzYhY7FwAv8EKYw+HmdD3c5nc/IMEOdRWCJL+5jJPgwaAIWEh2Bw0jwbmguAwKLMsBs0ybQTlLpzf4XNIFozhCUg0E2U1YBjLJcvsnG/icmUGIqf0Q98lLCwgJTgR2PMM33IoPsbyqyATtuiG8AE6YxVdAZmAdPviW9khxwXX6XgDW70GFKjAiOZ4SfCRHaG8iQAAUVg1vtT5KZG5rAt20Ly7JUcXRN386KPEHTn98II2ma3u37HtZ11c5FSnL6sNqVVUa0dXYPU3aS/yidS9AMrOo8UltjUtO6lXpeBAn6oT0XRO+N6Kk0xu/KtHUpXJ09PMC8WpegrVJbHUGzeYEraL7wOI4UY55nlcMjldYmPMCcpcT1LMbDgO2qd3bAjmW1P6lzpUvMguZjpmdWaGUY7doskzdVuVIzLU1okOnuqbC1GX6ArUmxZFoq0y/lb0G27OZESfr6RzZboFaXQb436grTEAPk/x0AAAAASUVORK5CYII=')"
        },
        rotate_W : {
            direction: 6,
            directionSetCount: 8,
            center : " 6 22, ",
            image : "iVBORw0KGgoAAAANSUhEUgAAABQAAAAtCAYAAACu/EtoAAABfElEQVRIS8WXzZXCMAyEbXJJGdsC/fdADXSRUx6LQxQmssaSSdjNiQfx59Hf2OT04fN4PnppLk+ERxZXS8seJlADrH21wPKOCSwwDTCiq9S5QA8yz3MahmEBbzCWQ1HZgnYBy64RqMTtKpQXI1CELeGzthHYNE1pHEfaXSFgRJkVLlXIgKIG5boKPRhCNcxUaAFxIf5+ChBbav1cGnsr7q7KnjrMncy7Ho6PgayPvg+UYYdpEQMIeef2EtrWY76ldLluTmIlvxmyLgb6oTiO1SIWNFswtK2cf57Oc698jypkjbp+v9swotJcsBZm+U058uvcaBxuVMEpClHN2546c2jZ/aEqa7tfNjjahwg9bVKs0FWF+0bv34EhP4yq3BmJavQqL55rn3KmWOPHCkbvh60zGJ3GPZdZHqldyUVzHa+/udvocWzdE0MhHwm7qyiYx/ANNnqV6waiGu8Cv+tJqx1kTt+uXWdGb0L/VkQ20J4JXcHv2KyRtRmrqcm/RYEqNEObMkwAAAAASUVORK5CYII=')"
        },
        add_sub : {
            center : " 4 4,  ",
            image : "iVBORw0KGgoAAAANSUhEUgAAAAkAAAAICAYAAAArzdW1AAAASElEQVQYV3WOUQ4AIAhC5f6HLnHqKIsfHXsiMNdyAeA0n6CnAgEaBeUefh3wKiBVJnbyL+l4Hf+vTqNbl1RwFH8lPSEBu6OCG+c6QwD6VCvwAAAAAElFTkSuQmCC')"
        },
        copy : {
            center : " 12 4, ",
            image : "iVBORw0KGgoAAAANSUhEUgAAABgAAAAJCAYAAAAo/ezGAAAAjElEQVQoU51TWw6AMAjb7n9oHQSwlrqY7UteLRScI961Xn7P9XZ+lWs+rjPbgSKYmGYPiym/JQG/56aP69xOEBjAASK5AAhEAbfGGgFOtO0qGsAc1YBLhBMIDXVXz4oqjlKnVE6qCHKJIBXnoUSvg8CaRgBX9GsHOPHnBKdXhDLgSbcJTv8D7p5ISrYbHeTwAt8s7ykAAAAASUVORK5CYII=')"
        },
        drag_EW_copy : {
            center : " 26 9, ",
            image : "iVBORw0KGgoAAAANSUhEUgAAADUAAAATCAYAAAAwE0VbAAABbElEQVRIS+VXwQrCMAztToIOZKeB//9twm4TprCTrnWdaZakaS1UsCdxbfpe3kvaNiYynsuAU5plxNaU/p6KQQRog0EOll8tUik4WFKekBfKBq1NSouFJIUJWTvlksLWWWMlWTgVzy64DXDpe3MdhqA0ckhh+/qAqYpTpGwsjxOXRECKWwyV0jQBuwmlEF6rnSftTyV7IyUR8mBw44MehypQ86W5Hhhct6q55QE1YdFFjhRLaL4bcziJ4kiAIBCQUddwUJ1u/6lcQeCCijmbYGAai+GsEtYigcK9qN8lsFilNPZneXIgciz1DSGYZFmpDPtxClL2i6nLZpLBte1Rs6ZKkgpqCnStfW25jByXKe8mWar7cZ3MA+u6zozjGHD+rFmazPwIGhhu61XOKQhCW9Cx2oUHMHmjoAL84o2Cw/Qfdz+uxnKUSjnvpLmpLwbVe+rctuY2TdWfHloc0ScALmR8Iy6lRkwp+D2G4QU4DssaN7UX2QAAAABJRU5ErkJggg==')"
        },
        drag_EW_wheelStep : {
            center : " 26 20,",
            image : "iVBORw0KGgoAAAANSUhEUgAAADUAAAAeCAYAAACMjVaFAAACZ0lEQVRYR+VXQU4DMQz0igMSVKK3Spx4A9/oE/qIfUsf0e+gPoFLkXorUkHqAcEmrFPHa2+cpEVV2ctSNrFnMmOvt4ErvJor5ARnJfXdXU3TQHeD7n7WXFSckyRy4DEogqeE+DPuDml/jYOqSTE1vCrukoSRFJP216paRYoDcmQQOLeeZkX8P9lbbddiUsoJe5F6gNSSkYJUMS1OTR0WkUpYrqGnzxVAa0qKsmfFihWRQiVIZ0MA4b5cLn1ttW0Lm80G1us1zOfzaB1pIIP9f64UghmpKUBSSGy1WsFisdDA+5A9kWKFwiHVtE5JMVdTSJaq5f52qiFwJHEqy1EeSfvRd0gPYLCnJ4FkQqNw9kQyCgm6NtpPQVowmEkpBZ88CMme9EDwEKwuycWhAuQTQem4k0tAIpqLRSSljDhFBcyto1l4TLVcPGJ9PM5m8LbdRnlKlOK2IbbMGnAlUi4W4uRjVURK20w7lKUOXBJLLFxnjBmmkqgpCF8BgdQYCPqStACg7xs8EKoSb+PWmNo67qKo/Tow0XX4ALi9t+QUrSopjABy1U/hosRGbZLNpt/gE3y9QHPzzKf2Yz7yvDQP3xeIdQ+kBlWVh8+E2PEwkfS8KiHZ7GKPK1VpP2oJNnWIg62ZmIKLKuWlol4PwStJ/Sr01MV/DSHpbzGnhZmAK6op0pWGxPzmOwfNL+Of6NPpFHa73QBGbfeT4h6bWNfMDp9RAxO73ygxWvy8OyqnejHvqRSxS5woNEz/Y/bTFCtRylLzljUnmdI5sYfJBN73+6Ip3QI6tQZJWXEkP/hyvzpTAEue52L4AURI4jQMP9/LAAAAAElFTkSuQmCC')"
        },
        drag_EW_wheelStep_copy : {
            center : " -1 -1,",
            image : "iVBORw0KGgoAAAANSUhEUgAAADUAAAAeCAYAAACMjVaFAAAChElEQVRYR91YS04DMQzNsEECJNRVJa7UI/QQPUsP0fv0EkXqrkgFqRsgCXF48diZfKYItZuhM+PkPb9nx2UwN/gZbpCTuSqpL/sZhsHYi7HXq+6F4syykQNPixJ4JMSfcXdI8T0O6ibF1PCquI8kjKSYFN+rahcpDsiRIeDcepoV6T7Edtu1mZSSYS9SAIiWTBRExbR1euqwidSE5QbMPleArCkpyp41K9ZEipSAzkYA4nW73fra2mw25nA4mP1+b1arVfIeNJBR/J8rRWAyNWWIFBHb7XZmvV5r4P2SgUizQjFJPa1TUszVFJFFtdzfTjUCTiTmshzymLQfniEBwCgmkCAysVE4exIZhQS+m8QjyBIMxaSUgp9MhGRPTAglodQltThUgHwiaB13aglIRGuxiKSUEaepgLl1NAvnVKvFI9bHy3JpXo/HZJ8WpbhtwJZVA65Eyq1FOPlYlZDSgrFDldSB20RSiMeWvpfbX0p2JJUjhIck60r+Kw6vrmVL79N96V0ChnHY+rFzSknlxJL2i4B88OXdmPvHrDg5QJwgHq6YfW0NdWMBFxKLB+WIUInPgkpSbAlZfIePXIXby3Vv75bYX92Dg+cWou931hOf1pmaVWvrVgPk1s8r1WA/jVSJElqCRgQUXHGPUITxfwnJAg2kNPDXJpXUFJEQu58n9eAqZ9TlsCPVdj+tfgnYYrEwp9Mpye9vjPXw5SNpYGL3yxILD4ut8dM8sucUgigt6KnaxQNYm7jjz2/h7KgeaHlNhNZevQ5XWDp4fcORukjtrJVrv/9i9tOsqGWl5TypjZllSufEnp+ezNv53DSl1xLIOacUx6SvuX2wIOcAXLJGLYZvX+LrNA0kdogAAAAASUVORK5CYII=')"
        },
        drag_EW_wheelZoom : {
            center : " 26 20,",
            image : "iVBORw0KGgoAAAANSUhEUgAAADUAAAAeCAYAAACMjVaFAAACl0lEQVRYR91YQU4DMQzMigMSINFbJU68gW/0CX1E39JH9DuoT+BSpN6KVJB6QLBJN8usY8fOZqkQe2uTtWc8tuNs4yqfr/aJJpr2kcz5fX7Zb8/tq4QTXhdBWIxHoHGvBBgJWQJg8Z3bM5qUADRRghLXAlBLaLRSlFBMq2CQSTGaer+diqOUIqD64Hbpx6oFaRfWpQCAkqZa5ZStJoXgOKBC3WWJWWtVStUqUt4oNL8k9SK49Xod/K9WK7fb7dx2u3WLxSIqigQba61O2iik1IsEsV1TUpHYZrNxy+VyQApqcRAoTFtrty5SihJClbrUS+xxannlvGqxBlFxJEc6pbmxmUlxhKyHKBLzZAQSbOpdWilzQDoS/USBqnaEgy1sELlazdWTSU4cgyBqRYSwTUvqarWKRLQMyYKrba1aRAnZpBsSIv1PbX40DaDc+WMFrO2z1Ko0wUiKsaSmOCtQBUqMgtHGplI8bAt+mM/d634/wDLm2lAyzGLDoEHgSPk9EScN0oCU9DKmn5ZOsbNZbHkwXCPifODQTGuN1lhPKgeCnBUqr3ioxraMd0f8Dw9fzSg96HPEBudD8uLp3bnrW81fss5dRTAwlFixAwYXlkf2FC921r0QHHw+u+bqqb+GxJrpMwLWx/phGtDZX7tgTWuzb244xfrRhlezI2ajt51XqjL9MCUSpc4fYNiJXCUl4Or9eQNik6gkde6Ej639lx4n/p6S1KCmojeWWCB146GFbfQL2Gw2c4fDIQlsbffj7P40sfaWf/oYNDB6hv7vcyqrWKeSNkhSyUomilwdSeUhTTl/YvbTGkP17CcpNmb208Ba1yeZ0imx+7s793Y8XuQ7OEc0krLiUG+w9GTWbp3W6JfsK8XwDbmKCEOB3VJgAAAAAElFTkSuQmCC')"
        },
        drag_E : {
            direction: 4,
            directionSetCount: 16,
            center : " 11 4, ",
            image : "iVBORw0KGgoAAAANSUhEUgAAABcAAAAKCAYAAABfYsXlAAAAYUlEQVQ4T7WTUQoAIAhD8/6HrlwooaUguM+hb2VGw2tuix5+Zrk+C+EC1g8eBbveGzK3BhGsEtz2CwRgUA+8JMMAScERkUNlJgLJ6tvhfIC2scjt2h5UA7pW8Q6orIz7Awv/fDoJc6M/ggAAAABJRU5ErkJggg==')"
        },
        drag_EW : {
            direction: 4,
            directionSetCount: 16,
            center : " 11 4, ",
            image : "iVBORw0KGgoAAAANSUhEUgAAABcAAAAKCAYAAABfYsXlAAAAYUlEQVQ4T7WTUQoAIAhD8/6HrlwooaUguM+hb2VGw2tuix5+Zrk+C+EC1g8eBbveGzK3BhGsEtz2CwRgUA+8JMMAScERkUNlJgLJ6tvhfIC2scjt2h5UA7pW8Q6orIz7Awv/fDoJc6M/ggAAAABJRU5ErkJggg==')"
        },
        drag_ESE : {
            direction: 5,
            directionSetCount: 16,
            center : " 10 7,",
            image : "iVBORw0KGgoAAAANSUhEUgAAABUAAAAPCAYAAAALWoRrAAAAqElEQVQ4T6WSRxLAIAwD4/8/moQij1woEzhSFhXLE1ehLUnOt1v8qMFK6UyRdvQbamC3QCj5xLFjVTlTWi8vHdTDAEVoIwIPP4KOKK1aboPgq5z1M9hQtQBkkZBEbx+KTLsN6hrXAus+gHSPVZv3YaSSElqNI3wzo94VRHnorFUN3MeSZN8nfLN822GuPfgPFIwUXiM4ga6MmBlHxjfQMIYo+QpKFgznBS4JUg1UFigLAAAAAElFTkSuQmCC')"
        },
        drag_ENE : {
            direction: 3,
            directionSetCount: 16,
            center : " 10 7,",
            image : "iVBORw0KGgoAAAANSUhEUgAAABUAAAAPCAYAAAALWoRrAAAAsElEQVQ4T6WT0RaAIAhD4/8/uoIAB6GW+lQeuQ426VhfJ5QSYsLPT/55Lykhcox87EC53sEI/wJlOdU5kWlqrUtWvQItYT1oT5EIsqKsLBj0zLZNGAqzerGDN6tWcQRqmENl4Lapt3ubvI/g7LYZVkLRwUoVzOfVjQoJkQrRyHkFZaMY+p06KnwcDVm0aaYNU1NCOzAPwOzRCDSHOBmWpzH9xzYCfAfcfX7o5lRaOnABJhFSDYrjuAkAAAAASUVORK5CYII=')"
        },
        drag_NE : {
            direction: 2,
            directionSetCount: 16,
            center : " 8 8,",
            image : "iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAYAAAA7bUf6AAAAk0lEQVQ4T8WT2w6AIAxD3f9/9GR1I4Adl8REnuupp6Jce0cnMZE9BlJazisuBXECoaBfIMc6Jt+qdgBTcLdrpRMgBogCLD0dtiTUAvFV/A3GZ5DJDloGL5pHEXmjqmDtHkgLA9KqZRuwMli4smLlWDz8yAYUVCHjMMmIdD8KOQF0Om3FJxDQn422ftDu5iUXZgm6Ac4cTAuOKDXkAAAAAElFTkSuQmCC')"
        },
        drag_N : {
            direction: 0,
            directionSetCount: 16,
            center : " 4 11, ",
            image : "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAXCAYAAAAyet74AAAAbklEQVQ4T8WTRw4AIAgE5f+PthDZIFjQi950J7g0Sv7k/kRaGi5VyPWwTsQSdA0CkkgaFtBBFm6geGLNfA2bTx57wHMyv0HTKFdwlGjav9YoE2Go6aqFv7OOjNnR49X0hOZRShmacAfvdgbwbAsLQ8pOFmgMo4cAAAAASUVORK5CYII=')"
        },
        drag_NNE : {
            direction: 1,
            directionSetCount: 16,
            center : " 7 10,",
            image : "iVBORw0KGgoAAAANSUhEUgAAAA8AAAAVCAYAAACZm7S3AAAArElEQVQ4T5VU2xaAIAxq///R1kwM5y7mQ8c8woShcp2PRltF5/2TjAlo7Z2KfLgI3HcCYMlBkFUOCU7AKPgcgOW+y0pQaR6nX/R2OSfgpSqZ1dmqyhPMLkOPBUOcrkdVp/lhq5RlMCy95bblfV51bXvjysNRnMDzxwOnDjNJCvYctpp/ObyBkRi+DFVVhCTMbhUiaM4IwiSmYLr8LgG7bXMcRdiN5/ZG2RfE/t8mdlgT0AOPHQAAAABJRU5ErkJggg==')"
        },
        drag_NNW : {
            direction: 15,
            directionSetCount: 16,
            center : " 7 10,",
            image : "iVBORw0KGgoAAAANSUhEUgAAAA8AAAAVCAYAAACZm7S3AAAAtUlEQVQ4T42UCQ6AIAwE7f8fjVDbspQemphgZHbpBT37GbAmWKdL3DTmwxuJDjYV0h8GehsQukRKuAL5hPMNXQUsYzdYXVzcPSxxXqfo3CNln/U225jkIwfgrn1gYpkqCyxwEbIpLZUvL7sAqJU59uXOu47aca0zxpXFbu7dAJSZ/w3DwHA/hEkI5u+aNq1E58xJ15ZF4VXGCv7KJTPuQR775JpIQYy9O7ZdTdG0dfDR8/DB3AstnFgT+eFT2AAAAABJRU5ErkJggg==')"
        },
        drag_NW : {
            direction: 14,
            directionSetCount: 16,
            center : " 8 8,",
            image : "iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAYAAAA7bUf6AAAAkUlEQVQ4T7WUyxaAIAhE4/8/2mRETulA2YONC+A2DphsLYqd7JAkh5QWlBpTnQh6LwEhZAXwLwT0J9exJjXI/SEgTU4+wVjr6smT0QcQBbgnhO4ghVh3OKlshFA4fJ7Wp3tQAcUWqS0VNxs1UXQRkUe+6RFkNJGBMElVd2utTWr4PFYgkD++s1Uln0BeXyf93+zdNEwLmaiqqwAAAABJRU5ErkJggg==')"
        },
        drag_NS : {
            direction: 0,
            directionSetCount: 16,
            center : " 4 11, ",
            image : "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAXCAYAAAAyet74AAAAbklEQVQ4T8WTRw4AIAgE5f+PthDZIFjQi950J7g0Sv7k/kRaGi5VyPWwTsQSdA0CkkgaFtBBFm6geGLNfA2bTx57wHMyv0HTKFdwlGjav9YoE2Go6aqFv7OOjNnR49X0hOZRShmacAfvdgbwbAsLQ8pOFmgMo4cAAAAASUVORK5CYII=')"
        },
        drag_S : {
            direction: 8,
            directionSetCount: 16,
            center : " 4 11, ",
            image : "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAXCAYAAAAyet74AAAAbklEQVQ4T8WTRw4AIAgE5f+PthDZIFjQi950J7g0Sv7k/kRaGi5VyPWwTsQSdA0CkkgaFtBBFm6geGLNfA2bTx57wHMyv0HTKFdwlGjav9YoE2Go6aqFv7OOjNnR49X0hOZRShmacAfvdgbwbAsLQ8pOFmgMo4cAAAAASUVORK5CYII=')"
        },
        drag_SE : {
            direction: 6,
            directionSetCount: 16,
            center : " 8 8,",
            image : "iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAYAAAA7bUf6AAAAkUlEQVQ4T7WUyxaAIAhE4/8/2mRETulA2YONC+A2DphsLYqd7JAkh5QWlBpTnQh6LwEhZAXwLwT0J9exJjXI/SEgTU4+wVjr6smT0QcQBbgnhO4ghVh3OKlshFA4fJ7Wp3tQAcUWqS0VNxs1UXQRkUe+6RFkNJGBMElVd2utTWr4PFYgkD++s1Uln0BeXyf93+zdNEwLmaiqqwAAAABJRU5ErkJggg==')"
        },
        drag_SSE : {
            direction: 7,
            directionSetCount: 16,
            center : " 7 10,",
            image : "iVBORw0KGgoAAAANSUhEUgAAAA8AAAAVCAYAAACZm7S3AAAAtUlEQVQ4T42UCQ6AIAwE7f8fjVDbspQemphgZHbpBT37GbAmWKdL3DTmwxuJDjYV0h8GehsQukRKuAL5hPMNXQUsYzdYXVzcPSxxXqfo3CNln/U225jkIwfgrn1gYpkqCyxwEbIpLZUvL7sAqJU59uXOu47aca0zxpXFbu7dAJSZ/w3DwHA/hEkI5u+aNq1E58xJ15ZF4VXGCv7KJTPuQR775JpIQYy9O7ZdTdG0dfDR8/DB3AstnFgT+eFT2AAAAABJRU5ErkJggg==')"
        },
        drag_SSW : {
            center : " 7 10,",
            image : "iVBORw0KGgoAAAANSUhEUgAAAA8AAAAVCAYAAACZm7S3AAAArElEQVQ4T5VU2xaAIAxq///R1kwM5y7mQ8c8woShcp2PRltF5/2TjAlo7Z2KfLgI3HcCYMlBkFUOCU7AKPgcgOW+y0pQaR6nX/R2OSfgpSqZ1dmqyhPMLkOPBUOcrkdVp/lhq5RlMCy95bblfV51bXvjysNRnMDzxwOnDjNJCvYctpp/ObyBkRi+DFVVhCTMbhUiaM4IwiSmYLr8LgG7bXMcRdiN5/ZG2RfE/t8mdlgT0AOPHQAAAABJRU5ErkJggg==')"
        },
        drag_SW : {
            direction: 10,
            directionSetCount: 16,
            center : " 8 8,",
            image : "iVBORw0KGgoAAAANSUhEUgAAABEAAAARCAYAAAA7bUf6AAAAk0lEQVQ4T8WT2w6AIAxD3f9/9GR1I4Adl8REnuupp6Jce0cnMZE9BlJazisuBXECoaBfIMc6Jt+qdgBTcLdrpRMgBogCLD0dtiTUAvFV/A3GZ5DJDloGL5pHEXmjqmDtHkgLA9KqZRuwMli4smLlWDz8yAYUVCHjMMmIdD8KOQF0Om3FJxDQn422ftDu5iUXZgm6Ac4cTAuOKDXkAAAAAElFTkSuQmCC')"
        },
        drag_WSW : {
            direction: 11,
            directionSetCount: 16,
            center : " 10 7,",
            image : "iVBORw0KGgoAAAANSUhEUgAAABUAAAAPCAYAAAALWoRrAAAAsElEQVQ4T6WT0RaAIAhD4/8/uoIAB6GW+lQeuQ426VhfJ5QSYsLPT/55Lykhcox87EC53sEI/wJlOdU5kWlqrUtWvQItYT1oT5EIsqKsLBj0zLZNGAqzerGDN6tWcQRqmENl4Lapt3ubvI/g7LYZVkLRwUoVzOfVjQoJkQrRyHkFZaMY+p06KnwcDVm0aaYNU1NCOzAPwOzRCDSHOBmWpzH9xzYCfAfcfX7o5lRaOnABJhFSDYrjuAkAAAAASUVORK5CYII=')"
        },
        drag_W : {
            direction: 12,
            directionSetCount: 16,
            center : " 11 4, ",
            image : "iVBORw0KGgoAAAANSUhEUgAAABcAAAAKCAYAAABfYsXlAAAAYUlEQVQ4T7WTUQoAIAhD8/6HrlwooaUguM+hb2VGw2tuix5+Zrk+C+EC1g8eBbveGzK3BhGsEtz2CwRgUA+8JMMAScERkUNlJgLJ6tvhfIC2scjt2h5UA7pW8Q6orIz7Awv/fDoJc6M/ggAAAABJRU5ErkJggg==')"
        },
        drag_WNW : {
            direction: 13,
            directionSetCount: 16,
            center : " 10 7,",
            image : "iVBORw0KGgoAAAANSUhEUgAAABUAAAAPCAYAAAALWoRrAAAAqElEQVQ4T6WSRxLAIAwD4/8/moQij1woEzhSFhXLE1ehLUnOt1v8qMFK6UyRdvQbamC3QCj5xLFjVTlTWi8vHdTDAEVoIwIPP4KOKK1aboPgq5z1M9hQtQBkkZBEbx+KTLsN6hrXAus+gHSPVZv3YaSSElqNI3wzo94VRHnorFUN3MeSZN8nfLN822GuPfgPFIwUXiM4ga6MmBlHxjfQMIYo+QpKFgznBS4JUg1UFigLAAAAAElFTkSuQmCC')"
        },
        select_add : {
            center : " 6 9,  ",
            image : "iVBORw0KGgoAAAANSUhEUgAAABIAAAAQCAYAAAAbBi9cAAAAkUlEQVQ4T71UWw7AIAiT+x96o0QThDL8MOMHAxUqD2WoPCoiAj1UC2xBAIFvYZIWQ6gs0DxvwWYilsDymR+aMIiXgCkDIUbJyLM4ZZRqRGrWMyLPqgK3NaItCl3su3bCiGGizeiuEfBOPw7BTp9oXeMzaO1Oo1EN7T1GV2vEFqvZvZSfFu5giX8O5L6Wr0XdWL09R6kBeQ6oDQAAAABJRU5ErkJggg==')"
        },
        select : {
            center : " 6 9,  ",
            image : "iVBORw0KGgoAAAANSUhEUgAAABIAAAAQCAYAAAAbBi9cAAAAdklEQVQ4T92T3QrAIAiFPe//0M0kYXPHJtLVhAjKPo8/QWo21ASAZDsqnElRSOpr9xWQ+gxdO98cdFfRVrQeej2mkp6iCDqqqNU1ktpnT6wTNiTBfGbIOe0ePDoJ6UV+XK0UX7Bziljy7RpF2I9BPhK7Hx/LcQFlbowBzQds/wAAAABJRU5ErkJggg==')"
        },
        select_sub : {
            center : " 6 9,  ",
            image : "iVBORw0KGgoAAAANSUhEUgAAABIAAAAQCAYAAAAbBi9cAAAAhElEQVQ4T81TQQ7AIAiz/3/0hgQXLSgcPIyLScGm1IpWq0eqAWi7EzpBJRcwQ32GMdcXwBEJthDZDGML11bRrKKqyLlkF4cfXUlXfVYUec1EVxWlr1ZRVEmI7r2JgHqURWP09dUoNl8vioat6Iy/p+iqR0wW5Cj1OwzZ/4hGJE4/nnd9ATzWlQFjavMAAAAAAElFTkSuQmCC')"
        },
        subtract : {
            center : " 2 2,  ",
            image : "iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAGklEQVQIW2NkwAIY/wMBujgjUABTEJdKDFMBHqMI/RaD0nIAAAAASUVORK5CYII=')"
        },
        wheel_add_sub : {
            center : " 13 9, ",
            image : "iVBORw0KGgoAAAANSUhEUgAAABsAAAAMCAYAAACTB8Z2AAAAwklEQVQ4T52U0REFEQxFk/qUoAi1KEI/mlDHW4z7JrHWZvlhkBy5STAZx68OZqY6UZ3ZaKaumYwkCNYnQAUbTld7t0BOIvw73sk0n51K2mHNuM3IyVirhwj5et7k/VlS+JNytDuMV846Qab5fOw/Arf+dpHBMMbY3xJCoFIK5ZzJOYfKlGCl1C0ybKzyMMMATCmR917BLG1hrkYZXVu3KCHpUOe1/z71GSBwviuSVdObYMjrqlpXvfn0u5hhAvjJRoIvmILGCbU+GGgAAAAASUVORK5CYII=')"
        },
        wheel_step : {
            center : " 13 9, ",
            image : "iVBORw0KGgoAAAANSUhEUgAAABsAAAAMCAYAAACTB8Z2AAAA4klEQVQ4T51U0RWEIAwr8zGCQziLQ7APSzCHZznCS3vF844ffdI0Tdqa5OE5r5NSkush1zM9hJmwD5AmRQSSMpG/86QRfmI42FXfVeiJhEQKIzy7MJX5QCVBQm/hylJ8J6yxvZMtKuqicE/2GcWscJUHMemLdfMeZAMYEvre0kC9Fd4pQ+LjODrXvu/SWpNaq+ScYdEkRn+5IJ7gJz0TkIGwlCLbthkyVnHbM7KId6kXCmtYnb6rSihA8oWyKSjcMx3XQWJsBskiOccafLhnfkFXOzgUmOR32J/JaJD++lUp/gXZ7CEYd6orLAAAAABJRU5ErkJggg==')"
        },
        wheel_zoom : {
            center : " 19 9, ",
            image : "iVBORw0KGgoAAAANSUhEUgAAACEAAAAQCAYAAACYwhZnAAABEklEQVRIS7WU4RHDIAiFzXyOkCGcJUNkH5fIHG3wQu6BPNt4F3+1lcrH48GSyPmcR6+W84zi5FrCR3Hs//J7+LgAYF6WQOOAdwqkgyAPd5V6UK10RhED4QFU5iZZIDnGSyv891EL8I5CBO0I1QDftHsGDEp1XptWgvhmCMK8FkIItTObUUEf27atFVhKScdxpFpryjlrLAKZVnn1bgjXT9NObzYPoSD7vqd1XQ0EeMkUhiANwgOgCleP6RShGvJZVLmgW57AJ3eBGucd/WjpoCKSnCQNW/FLCbodo5ELxhrVNUpTr+HozK7dC2S4fbFFfrE9qvrf5eMK66YFWtHyvwYRmZ0p/RpEMHU016sQADLM8wUuElMV9kmntgAAAABJRU5ErkJggg==')"
        },
        ew_slider_wheel : {
            center :  " 12 13, ",
            image : "iVBORw0KGgoAAAANSUhEUgAAABoAAAATCAYAAACORR0GAAABPElEQVRIS61ViQ2DMBBLhmgHgBk6Redlis4AA9AhKI7iyLnmQyJSlXJc7PM9wbux9YhuX3Ev2apovsEDIABj36Pfs2PTQDLoGhHBAbwfx+G2bXPzPONwsK3r6qZpct4HiGCLe5GsRBRIAA4Q7jG8d9w/VFnwo+quokQEzxgxCRY5DcDX+VtAZnwRSKasqYigkSyoG7AhqHEi2ySsCe1SM+s6TISDSB/SwrWAKDZDsMkz06qElxWhDlhsbwVlvajAjkCzGbKOOz0JgkNUiGi51JY69Xz513naDImkkX9bj+zZdF9GRqKspZtogy9lkEObg+h2EgCbm+RbVQTHqwtXkiFJN8ntNRIlel0lRQw+pLEzIzWhOmsZCWtkD+pnQdu7l0k7a9nQtj4TOiPV74yw620ydDNoGvF/hKR75gc/gagpSBM4aQAAAABJRU5ErkJggg==')",
        },
        flood_fill : {
            center : " 4 18, ",
            image : "iVBORw0KGgoAAAANSUhEUgAAABEAAAAXCAYAAADtNKTnAAABbUlEQVQ4T62UTUrFMBSFUxScOdKBoCDtEgrO3qwVBCciuJa3hHYrdgsdPHDoWHTSh6LgLyiCOJJ6TsgtaZukT7BwSHpz8/Xc/DRS//BEE4zWjK+j/fHlhiBtlmV6Xl3XbBJo6QL5IB3AgnhBLkgPIJC2bVUU6fSRoz9BSHCBhhCvC3sthqARhLblYbL97gM5IeZLqmkaPS+OY+fuiiMvpCgKlaZpD2DDyrJU8/mc8FkQwgyCbDcCMi5OMfYSLIduXKCqqsTFMcbvQpAzJJy7QEnCo6JOoHfoKgSRpIUNyvNcAF/ocOWXIcgREp6hb+ja2h7COwDjI4iJ8bAcmi99ot2E9qA1iLf5ng4ELBA5YTZUYtsmmfXvQI8G1JnjJBxKfbk0gC+DPsN08WCV1Ouu4oRlfUCXU5BdJOxDF9aaHKC/YSberuKEuVvQq/XfmBkHT2jffC4YH+6OBkEsgVt7MwVwQRhjabIL3sW0nf0CgMme8t9KbzsAAAAASUVORK5CYII=')",
        },
        flood_fill_diagonal : {
            center : " 7 18, ",
            image : "iVBORw0KGgoAAAANSUhEUgAAABQAAAAYCAYAAAD6S912AAAB0klEQVRIS52UPUvEQBCGN6iFjZUWgoLeVbZeLVxxUQQbEfwt+Ql3f8VrBZsrBDsFK8UqB4eC+IUgqI0S33fZCZNNNgkGhv2Y3WffnZlsZNp/mVs6j/Y3tC1qycsGg4FdOplM2HRh06q9bYA5TAGD0CZgASbALMtMFNmtJaX/BpJWBa0DBtXp2PnQWiCvJh836nEI2gh0CkyappbR6XQqC0OUtgIOh0PT6/UKMA0ejUYmSRIetNMayNWEapUCdeqO4HvWQAasMFblYaiyCjoej0XdAfwzAWBvXlvrcDzCftTcMcYnVdBul6VoDmHvsNuQoi047xRQNpxraBzHAvtEh1mblhTqa6r+PhY/wb55kEozD8phnCdQX5dxOFUg64ftOgUfaJdgDMscjK/OPZXJIblCTPRhi7Az5/QTxukV52O8VmGMdeEpk03LcGzCLp06O0/pKAnd5zTVPYgiv/XrkOCXGoWM5Rvsyq3xS61Qd3LYGjobsAtYVYxnmL9xF5AXh6F4JSD0p1ilgYxvw3etfH2Mv0R13a8n1+c1mdE8+wq2R6UwlpKNa9MDy+szm6y/BU8ZD2KGbUFLvJqAsk5avl0EsC75FWBtFPpAjkU1a7BUPn8rpNfzRVmM0wAAAABJRU5ErkJggg==')",
        },
        flood_fill_edge : {
            center : " 5 18, ",
            image : "iVBORw0KGgoAAAANSUhEUgAAABIAAAAYCAYAAAD3Va0xAAABhklEQVQ4T52UzUrEMBSFWxSfQBeCq3btquvZtYIggvgyfYT2WYprN136Bs4gCB0RBUUFN4ooSj0nJPU2TVpq4JLM3Jsv5/7QMJherQ7ZxP7jCw8nOG2apiqkrmtuMWztujMG6iAC5IX5QD2IAbVtG4ShujJQNhtEigvmAnnVyNrYMCeIKZjFC/K3D+YF6ReDpmnU3SiKnA02ykZBRVEESZL0IBJYlmWQ5zkfWEyCGEWYVGVgWs0pfE+TqVGVC1ZVlVFzBP+tDVJVFvOiIC5YHHOUghPYK2wlQbj/1y3ZNRuWZZmBvOPAbqwNiIQd2LNDEWtwZrWMSjoIfQQpJbpwUzUj9BP2Brujkk75TNAx4h9hN7AXqbJTpORpWZQoz9rH7RB2LZX8VxFBS9i9VbPZNToA4MoH2oDjW8s+d3RtH/9dav8H9gvY4JNrurTHLozM0QJ+PsiZGaSlaihy3cZZzZG1WBcqWcF6nZJx9txQGWd/SytgCl9jSgzMNYBMYVe89uCqiS37F/+ivvNB1JEYAAAAAElFTkSuQmCC')",
        },
        color_picker : {
            center :  "2 19, ",
            image : "iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAABEElEQVRIS63VixHCIBAE0NCH1GEjlmkj1oF9IMuw5Phc+BhmnIyZ5LHenYk59tdD3PqtGbPoAgOCoxP32nQ+n1qBiQFx3vsTMZEp8Fk4osBMQHikLL5nfAbuokyMjbBqfASrKEGmds4d1iLw8QqfzwjGhQWuNftfGEHOrqVdKhRnh4llWhPq6EMJCryHYvSuSqGheRg69R1OxSUaUsZyoFkriYdo6r6KYtO6FLMoRgrrncYrNgy1ZXkkvIoCwnrWqEy8gzIdH0zFiDNxAcsr0Cjxj2p+svaHAXw7ylI0sBwnrTla0l7zMD55PtMF7H7R8RHaGzc+BwhO17TerDfHGB+CODbvs53EuIcvyS2Qm/4A4frWa856TpYAAAAASUVORK5CYII=')",

        },
        special_move : {
            center : "17 17, ",
            image : "iVBORw0KGgoAAAANSUhEUgAAACUAAAAlCAYAAADFniADAAADoklEQVRYR82YS2sUQRSFu32g4hMVXyBGjfkHbgR3LkIEf4VLQ8SNIOJC0K0J2fo3DNmK6MIsRPCZh46KxmeM8Y3R9nztrenqnu6x7cnMWHCoqZ6uqtP33jr3dodB6y3UEssE+kj4ZX3llVmolcb8VcJXYafwQ/gsfG+FWCuk6oSiKArCMF7qoPBCmGuFWFVSKULO1EbssMaPWiFWhVQuoaUkVoXUCmIHlxU1s9gh/T9jFlv8l8CtQmq1BXZ9Hy+m/L2PaXDXYuxbJ0jt0Cb7hR7hcjQ5GYR9fex7SXgnvBRqZil+t50U7tsgbBa2CdejsbEgHBiA1DlhWngivDbXLahvu/tw+XJhpbBRmI1GRoJwaAhSJ4VbwqTwQUC3fgrFAcisTKsSU/4S6zVYiAYHg3B0lOsnhJvCA+Fjzn6lLi0Nqf7+IBwfbysp5x5ih0Y85LmA+3Df+6i3NwinCaUAH04I9819WbeVWjtrKT+Xscle3GPwgzURUM8htthRXUIKXgnZHBhrnE3h9H6ytVP3+aTyctkRTaoJ5DOSLi1FyF8As9i4KNWs0S1fPF1DYDmpqVzp1mxIHabKxzXhnvBYIPvTeNo5jwAnjtKFkmU4Q+yZWcJZea3Gsy4bFOVKyDRLrsYj3WUI4YJZgX6dcMX7P3++l6LyiLnAW8zNZVNTkkIFcLbXNTPxKe360IAuEfjTcXQr+GMcONDYZ6h6ZQ8emWdt3LHVNytz7MYylkIscfG8sEl4U8FShMBtAX176yzFYpy0iYy/yWUEIULo4gI1H/E25rRhLSzlEzqvMTmPWERSaBhgOLPHBV1DT+4IdUu5mCKX7ROueafjrMYUbM8Fd/pILzxEQ+wUxBoWdDLA6bvqrX/RiGChemGYPX11YvZkRaePhLw7fgC7kc4WwxVUCjUh9/TZlNN2H1ZOVap5OgWxPcIWsw6L5+lUYtlE0XHZU6FhIyOCpXYJPQK/IV+oU+55nSuxBMcb7Wmm6NuxSJTkvjMaE7DNFJ21Adr2V0X3iRHM5XNfUiW0Jfc5YmX7P6VLUk/9R6VLUnl2jZTTtqTyTGr0rlWefvkRu7ngbUb5JRbejtTo8StWifc+yh7e+zryNgMptGYmj5jlTISR6rNj7324D+GkcrzhEzNCpA4UmiTdsTfkZrmS5FoTUrmMsCurMdyXrdHLzm0gpomcPCoFMn7Hv7o44j4xYoy0RNro2vepLDFqb3Sr61/yfGJL+s3zNxQ+pEFMejk4AAAAAElFTkSuQmCC')",
        },
        time_slide_ew : {
            center : "11 5, ",
            image : "iVBORw0KGgoAAAANSUhEUgAAABgAAAAMCAYAAAB4MH11AAAAsklEQVQ4T7WT3RWFIAyDYSjvSAzFSN6hVCrhhFhQH+TJY9KP0p8YxmcjKTq2O91CvECwtuOcpmg29qr2O/S/l6tegKzKf4NUeAGUwxDV1+rpmJesCLjSBW4hJQH2Ny4+9MkGRIkmfcILOz+XtJVCITnnkFKasU0b+XDJly+wvn3VgzYUoykqBm4aArhkqmOKuonz9mCpFAO83APEtnGeLhql6+6B6I8WTacGGemSwXenhx3LOm5ChxAVAgAAAABJRU5ErkJggg==')",
        },
        time_mark_ew : {
            center : "11 6, ",
            image : "iVBORw0KGgoAAAANSUhEUgAAABgAAAAMCAYAAAB4MH11AAAAxUlEQVQ4T7VTWxLEIAirh+oeSc/kldpDdYUaJiJ2dj/qR+sEITxC2p7PReZE9xU+RWOniOpqR/GU9Kl8PPZp2LnK82cCkICQSP8iQOkg1mwlex8YeCMCgfe9K+e+Rk6EKUlvFd+NgOwWd8iUyjZeDsp9jvBgXuPQ/KDQGvnXWs1cSrEKBM85z+rponizAmnd4wzEfri5INMIj7DTyxRKiAbHcjR1BSrSzLEb0R7s9IA3diCgpjPOvpNMV8sIJ8uqP1zhQ5wvONKFQoV+87sAAAAASUVORK5CYII=')",
        },
        time_start_ew : {
            center : "13 6, ",
            image : "iVBORw0KGgoAAAANSUhEUgAAABoAAAAMCAYAAAB8xa1IAAAA3ElEQVQ4T5VTyxXDIAyDodqRGCojJUOl2LV4QiVAfQJjS/6InP63W1LyDsRWEAHd1TrcnB1iibMMGJEEeDLSOL9r3DXrTIlQrvm5dL8LsOGeAc5EjNG4mUiBTgH2u8/pOy6M7BVndMQ4XaDFtdkTCI8mlVLScRzuayyVEH4emxTUlviz4OmsoxsGU4FwPsSC1pYdIdk6MEN3PAHESEe2v06WWztixdG+HCxMd2vu60l1lghFWaDfH/4QSJoYgrDzj/4Rqwhnr8pEI/tTEjyrEtc/eiAMJkcBM/342wdXzHdCwYl6KwAAAABJRU5ErkJggg==')",
        },
        time_end_ew : {
            center : "11 6, ",
            image : "iVBORw0KGgoAAAANSUhEUgAAABoAAAAMCAYAAAB8xa1IAAAAyklEQVQ4T51U2xGEIAyUos6S6AlK0qI8E1ln2WMgc8z4Ie4rJJK29bomkLSmP4gI8LrXj15KTt3v54yYhY2asGr+bYToHMArogrU7KAN4400uqNTQRwJ77MJwijvoGBv4A7sTXvOvlvaI8WQsPOAbzgX9FJHzYaTgVXIvpVStpzzcg5gFq7ICCxca31NFhXZwEx7BCE+89HU8XcT1XfjnNoQTAyP7eo/4qlzo5bGKzETrQhpPwywHk4agUDgQFg1QjeDkVlIfUM3wxeC62pC6WwpkgAAAABJRU5ErkJggg==')",
        },
        time_seg_ew : {
            center : "13 10, ",
            image : "iVBORw0KGgoAAAANSUhEUgAAABwAAAAPCAYAAAD3T6+hAAABD0lEQVQ4T71UgRGDMAhMRnAFnaHdwKndwM6gKziCFS6ffpCotXflzkuCwAPhE8N1WZNpJBdPdxiRnT1DCSg26yb6P0Z1qerSvyroEaCCCADWFOWZ1pckInvHrhr3FJCqAtBI6Yv/Y/tG0wGxlYR2cgmQQLWaZVlC0zRor+ogqeX3AG160zSFtm3DPM957brOK+QWoASSdkHGYRhC3/dZQWe0m8EvtZTH/NOnNJVmaOSI+xRAe7cuZQpO0TRqAHOWjFExZw+dtedzxsHG8kyLMXTw7qrQWXuHuyWBTyP+YIAH458V6mB9c4dn9R3dYX6dLPExWXbqqryiLHiq2Z+fwqJC+PIkMg9dXpmyrf1uqt+TZ5dFK639zwAAAABJRU5ErkJggg==')",
        },
        cutter: {
            center: "7 6, ",
            image: "iVBORw0KGgoAAAANSUhEUgAAABcAAAASCAYAAACw50UTAAAB3UlEQVQ4T52UO0sDQRSFNyq+IiIYC9+QVNZipZZpBX9FflN+haBlwCax8Q8IQgIpfMVHIRqfMZ5vndncbDYxOnDY2buz59w5d+6kgs4Y1XRCeDaxcc1bwpeJDT1NuZU8J4VmsVgMstlsGM7n8zxmhFcnMjQxCz35iCNZ0vMsQWAW4ZgA/wDPAV/b7TLcaTzzBcVWhJMBAvwIKTt9SthKtFOriudTAgLLQrmPwJu+UZvHarUaWYhIrVYLcrkc03Cnlpw5GU07ASxKElhU/MoTp1KWIgiIO4G09dx7GBc4ju8gRrwnsU9hTDg05BnIk45ggpU/IU9sLIjWGuJNBeuQ43Oz3abQ/x9GbFssl0IDcswPjyDK/Ybz8Tf1XS24EO5I2GceHcEBf+/r2wH+MwqFQviMvW+4rOnylvccazICIpwWiuoH5/rdxSqlUsl3LoXEyyMTW9f7tVsfNRFFpSkg5j6Jdx0kaeHcnxx3NWBD2ZCv6v1G+CAzS5LUzj57vs0Ja8KpFYCYYjqb6O5GErlxomcKue3eihcwxFtaUxceBG7SrswHkfMN67CN2nC6KuaHHc05JWT9IoTnurt3f6PvCMxrKcXnjuGuuRXuha6b86/kfge++LQ8rQ9pz53/DXCvolPOiVozAAAAAElFTkSuQmCC')",
        },
        cutter_cut: {
            center: "7 6, ",
            image: "iVBORw0KGgoAAAANSUhEUgAAABcAAAASCAYAAACw50UTAAABlklEQVQ4T6WUy0rDUBCGExXviGC9oK7alWtxJS67LfgUeaY8heC2y+LGF3CVQBcqFHEhtl5Q4/+FM+U0tk2IAz9N58z8cztzwqBcFmTyU2721yKs41TV5z/kVAR8jsxVmVdahxwfSFeF1ylVbEr3Lnz75IsoKpS8LJsV4SVJkqDZbI5d0jQNWq0W/7eEUbGkedxmeyCjRyMOw8ni0bsAG3aSdbvduUm32+3xeYG4o4MvYUm49sgbkNMOyhxWaElgxF4LJoK6rE+l7EO+Rn+yjEHXFy/YuVgehAHkNP9QuCOrWeIyKot+IYN74ckGSua7wrFwM8f7UmdXcRznJlEU8QMZ0kPvdCcu86H1nAANF2Rdv9xjExbi0+mw79nw/SFjjN7p9ixz9AyVpYCYe1y8ogwEsCD7lql/xyGh7y57upD33GTaOvtnfBOYe74t3Hq+/ueZ/vSF56rrby8jV5YAO8KRY6Rl6D/cGQMdCG9Vyf3MLABtNGGBWCSEd2UkTLwtM6qcqmZGzIdhF4efP1p41cncopU+dL+6U3Fq6/yNrQAAAABJRU5ErkJggg==')",
        },
        add_sub: {
            center: "11 4, ",
            image: "iVBORw0KGgoAAAANSUhEUgAAABcAAAATCAYAAAB7u5a2AAACdklEQVQ4T52VP2xSQRzH7xVBY0qbSsDBtNqkdCExcXBx4M8CiSbGwcTJ2UncwNlJ1jaQuLt0JSzI4mOvhigRQtSGpFZ9GltRq1b6/H4fd/R45QX0km/e7+5397nf73d3eYYYbQa6h9Ac9As6gGzXnKm7hOnNfgjU/cHoIvQR+j01bUykamgGRl+DJ9BvQl9kNmoet9azcQeo5tl0qFI4gxpcTQrB+CZLxEyWZcn+uDbV43bWOFEQ6NVkiZbgf25ZVigcDu/CjkHbXstkKkv8BqGvCj4m8pvwbUE7sky38GUG1LZHUFzzhvAAdFama2rw2xjrQbu2bT91QwzDYDZcew6adfm5bkvV3C8nfNbgNzDWBvgVQMcCxLjAeBQOnodeIdo8D6fmqvG2LECfIKZlAWASfMcU4hHujgQKdAWvkuxfgPkB4pUd2cQdEtOMUFi4SfD1NSGu3B3cfQUnYR3KHm1wHuZ7ucEwWjecfZboFEB7Kurl+HF4fTR6JvIS4psYRu/1AGYA7+vwt6CxNCwJ9hIu+FUMPYN4gybCDcAPxx3k0RENLFmqazA3/xlumqaIxxkrnjLOgLB6vS4ajYbIZrP/B+/1ehvBYHChVCpFEonEnh4xNpxvNpuzxWLxHb52LBZ7AH8D4k2bXBY89Xt46uFcLreSTCZ3fD4fy+QsrNVqi+12O1Iul19Uq9WDTCbzGMOvIb70yfBOp3MpGo2eSafTl1OpVCsQCPT9fn+f8EqlcrHb7a62Wq0nhUJhP5/P8zAt6Oc0cDJOQKehk9Lmq3PgaD7p4/c7tA/9gDhn2LyuIifQx1erxD+USpk+gvnlhpTudzb4C9rvAJo819g/AAAAAElFTkSuQmCC')",
        },
        add_input: {
            center: "4 6, ",
            image: "iVBORw0KGgoAAAANSUhEUgAAABgAAAAPCAYAAAD+pA/bAAABdElEQVQ4T5VUPUsDQRC9Fa0ifmGbSv0NWoilImjvnxEC+TP2FmJrpZ0WQiCKjYWiFsoJkYTbvBd25GVvN6cLj7uZnZ03MzuzrmhevsFkDfvfwBCoxJb60iUOx7rq1HdqZl3XKajnF6sNvAED0W1D7sfONFqL7Me8y+GJSuRdiD3gXXT7kG+VgP+V975wbqJmBA/B+Sa+N3L4BPKZZRay2IDuUWwOlIAe54CRENDgDvgEWlF0x5DPI4I96K5SBFOXKARa9/WI4BDyhTnT0iUJ6DS3Qrl2sH8th/9HoM4zGbBclzkCvfBUBqsw2AJW6EQIeJElwP7mPWQzaCJYgMEiwO+rEBxB7gfno1l3gL1UV6W7SMplXfRiuhlzkOqqKQL6YKuyTCzXEvAFcA4+/jDJvPQnoJebAwvSyjUPBcvCN+Z3kiW7+JfR3gPPslGbZNuLnw/LajlkGTtnj7MJdOqtArW3KBWkZpV6HEnAbNlxXGwYq0A5Bnn41yzq0raRAAAAAElFTkSuQmCC')",
        },
        add_output: {
            center: "4 6, ",
            image: "iVBORw0KGgoAAAANSUhEUgAAAB8AAAAPCAYAAAAceBSiAAABwUlEQVRIS62UO04DQQyGdxGPgod4SJR0nAEuwEuCFnIaipwm0FIAN6AEWjqoEBABgQIILP83zCzOZDZKpB3p13q8tn/b45k8G23lMv8xLouS2wP2VdHxeyNYvKyuMD8dcdFqlqq8cehkdF5e1/Yi7K1tcPJ2a9rfxOSWzGUnfHnHIgQjQCz7oNuyPTPJxMmFHDYkXFnyv8qKIstzp3bZCc/ew1XtSRrStWyFXr8j/WmVnf7h1xEebeWwjQldQ76l/aXwRGeFbxN0T/uTIch77OSz6wuCvAOpbXVmyEOL+C6RhCHvqbBKL5+4ExwLBT3QZUcOYdXyR9AzSHHQEchDNyEvhq0cp/MaKu8jX1DgVWHeEfwPHMMRpv1FcnmF6qx8QsFmBL73hjwMB9PerenM+yrnuMtpN2efnHZnnLjnKX1i4JLkIQFazxHMCa+Cvef8aydeuAPpjyoenXjaK8lJIBzBuG+1feEmpVsW7kx39iVzZ8G116M79rIbVGO/KZmrhr2b9ngNettJjgRWhGnhXbgVmAs6gx5/BpTuMStcK3xmBdvNJHkin1JFYBKAOHSHBHj/gx7jT4FOsT6EKWNfdvMXTGo2YPtxfKkAAAAASUVORK5CYII=')",
        },
        pointer_right_help: {
            center: "7 4, ",
            image: "iVBORw0KGgoAAAANSUhEUgAAABQAAAAcCAYAAABh2p9gAAAAAXNSR0IArs4c6QAAAWVJREFUSEu1lj1OxEAMhV96xE9NAUqa3IEDICUlZ03BNShQKBItQojtFgT9IJvxyGtmkpkI0mykjb/45/lNKpRfzodcAHi34VUhz03TxCFN09DPNYBnzSgBumEY0Pc9xxM4Bl0C2tLOARwA3AK4V8AbAI9SfgronPvhVRU/IqVdATgF8KCA9IInKT0XKG2iQRwU7A7AHsBrEZAA4zhy/0xmXwA+AbwUlUzlz/PMQzDANw3jFiVkc9TDBWDonXCKgT7wV+82A1Ny2QykQC1wu4bFJROsbVsekO6taLUYqCEGyBvzl0DemH8DWiOI6pC2pes6Frm+964TMowZwU7MYc0vZYO8C3HJbJp1XWt34QnmXDEg+5yG5oDkmRiQ/iOf222BpoCboAoWdtvKpihTkx1bWUyH2VBbLrl2StgBujQgr78jK1s69Ri6MnGBhWNg7Vwm6CWAkwQ4+0zR8aTTs4VMP/QnyTeeUk9EkFxV4AAAAABJRU5ErkJggg==",       
        },
        /*draggable_ns : {
            center: "5 1, ",
            image: "iVBORw0KGgoAAAANSUhEUgAAABoAAAAYCAYAAADkgu3FAAACVUlEQVRIS6WWz0tUURTH35SGKZE5bRIUXWQLRQJBYgjmX59FxOBGqJ1u1IWr8TdaWM30/dzOeZ65vTe+qQuHd3+d8z2/72sV46Ol5YwRJz+NRtm9fAnfU9ET0VD0SzTGwwUfzJ+JnosubPOVvt9E9zlj4EP4rGhOdClaFH0X/TDQdDUCcXkBkNHojzKtVjoG7NYYg/w0dRD4zuAznnbgwcISCIlohDanGdCyaYqWaODK8XXlEoiPDCx5IzLNa2NJdJIBrWGlyIGIIQNN4TmPIBlY6Y0cCJOPMyDnfW2TgX1ZE9NTvxBc51tvNLlCyUeBctBsvW5WEaO9ALSrNXHFEyUQYBDZ9pdFjwC55pO+xP3OAcgefM/mURReN0dyPBsMBkW7jZ4Pw5IiuQ+gWFhvtT5sAlSRZXVWrejgPAHVuaeOE00zno+6+6nf7xedTqcYDocftKZgKfYUpzEgBEchTQJg7klXK7JuVdvXHqMtTb5W1UJToF6vV3S73ar4UOxl1pGiL0X7/wLmFlXEbJPYRCBShY5w8B9AHfF/Dq57bwA02dQniRHFRloD9mUaMLNmR3z0M8pjXwQIccFlgJS9jsb4woDK1G4aH917ZwKRAxjZduOW6Ft2b4qVzk0DnMoqs2hNfKSwP5o8lrXv0dRWGci2hNJkiQUAgE18Yae2yoA2JPjMXAUQo/LZz1/YMlZNYqQ7uA2gO49FHV8EcqvIQOqKuLFXNXAP7QWXpYKss8SZIxB7xIrngpeTeX7ufLiH7MISAJlPHLmg+LtVZ40LxKqmv2PFb6IdAlQRW8OaAAAAAElFTkSuQmCC')",

        },
        dragging_small : {
            center: "8 3, ",
            image: "iVBORw0KGgoAAAANSUhEUgAAABAAAAASCAYAAABSO15qAAABR0lEQVQ4T5WUWUvDQBSFO+K+4NKiVETxxUf//79Q6JsvhSqFiktFqqLSeL54bk0MaXTgcCfLfPfMzdyk1s9Imi5a3J36UebIdWi2ikUM4rK0Jj363oHiSNqXbqVd6V36kD6lHByAJc03WJxl3wlTSi3mxWgwoFfDMgALzryjeDMPEEC7meAGwIq0Kd2RIQDOVgk40jiUxjjhisy59bBbtzi2pngsPUgTAF1p+E/AidbcB+BIk+sm6+HKWygBcNCWen+BGFDaAjVA29LlPIgXn7vgsyLyFTgDANBFHcSAM+//WTH/jJwDDtKWxCG5agCc2sGL4jROIpB1qSP1GwBRQAD5SWQQAexJg6h4TYwCVgCrrgEFpalwVRx0Ij1A8Z6kt6IDXqQOLMQJ83AXELqMTiQzIOall4r/g9/ZA4ILWrnSzg3brn/8BYOPexP7rMgvAAAAAElFTkSuQmCC')",

        }*/
    }
    const cursorNames = [];
    for(var i in cursors){
        if(cursors[i].image){
            cursorNames.push(i);
        }
    }
    (()=>{
        const curNS = new Image();
        const curEW = new Image();
        curNS.src = "icons/mouse_rotate_skew_ns.png";
        curEW.src = "icons/mouse_rotate_skew_ew.png";
        curEW.onload = curNS.onload = loaded;
        var count = 0;
        var can = document.createElement("canvas");
        var ctx = can.getContext("2d", {willReadFrequently: true});
        function getDataURL(img, {x,y,w,h,name,direction}){
            can.width = w;
            can.height = h;
            ctx.drawImage(img, -x, -y);
            var data = ctx.getImageData(0,0,w,h);
            var d32 = new Uint32Array(data.data.buffer);
            var i = 0;
            var xx = 0;
            var yy = 0;
            while(i < d32.length){
                if(d32[i] === 0xFFFF00FF) { d32[i] = 0 }
                else if (d32[i] === 0xFF0000FF) {
                    d32[i] = 0;
                    xx = i % w;
                    yy = (i / w) | 0;
                }
                i++;
            }
            ctx.putImageData(data,0,0);
            var cursor = {
                direction,
                directionSetCount: 8,
                center : " " + xx + " " + yy + ", ",
                image : can.toDataURL().replace("data:image/png;base64,", "")+"')",
            }
            cursors[name] = cursor;
            cursorNames.push(name);
        }
        const nsSet =  [
            { x : 0, y : 0, w : 41, h : 41, name : "rotate_NW_skew_ns",direction : 7},
            { x : 42, y : 0, w : 41, h : 41, name : "rotate_NE_skew_ns",direction : 1 },
            { x : 0, y : 42, w : 41, h : 41, name : "rotate_SW_skew_ns",direction : 5  },
            { x : 42, y : 42, w : 41, h : 41, name : "rotate_SE_skew_ns",direction : 3 },
            { x : 0, y : 84, w : 45, h : 35, name : "rotate_N_skew_ns",direction : 0 },
            { x : 46, y : 84, w : 45, h : 35, name : "rotate_S_skew_ns",direction : 4 },
            { x : 0, y : 120, w : 30, h : 45, name : "rotate_W_skew_ns",direction : 6 },
            { x : 31, y : 120, w : 29, h : 45, name : "rotate_E_skew_ns" ,direction : 2 },
        ];
        const ewSet =   [
            { x : 0, y : 0, w : 41, h : 41, name : "rotate_NW_skew_ew",direction : 7},
            { x : 42, y : 0, w : 41, h : 41, name : "rotate_NE_skew_ew",direction : 1 },
            { x : 0, y : 42, w : 41, h : 41, name : "rotate_SW_skew_ew",direction : 5 },
            { x : 42, y : 42, w : 41, h : 41, name : "rotate_SE_skew_ew",direction : 3 },
            { x : 0, y : 84, w : 36, h : 45, name : "rotate_E_skew_ew",direction : 2 },
            { x : 37, y : 84, w : 35, h : 45, name : "rotate_W_skew_ew",direction : 6 },
            { x : 0, y : 130, w : 45, h : 30, name : "rotate_S_skew_ew",direction : 4 },
            { x : 46, y : 130, w : 45, h : 29, name : "rotate_N_skew_ew",direction : 0 },
        ];
        function loaded(){
            count += 1;
            if(count === 2){
                nsSet.forEach(s => getDataURL(curNS,s));
                ewSet.forEach(s => getDataURL(curEW,s));
                can = undefined;
                ctx = undefined;
            }
        }
    })();
    return {
        cursors,
        names : cursorNames,
    };
})();
