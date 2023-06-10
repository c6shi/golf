function load(){
    let filePath = "clean.csv";
    preprocess(filePath);
}
const margin = {top: 30, right: 30, bottom: 70, left: 60},
    width = 1000 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;

let preprocess = function(filePath){
    d3.csv(filePath).then(function(data){
        console.log(data);
        data.forEach(d => {
            d.R1 = +d.R1;
            d.R2 = +d.R2;
            d.R3 = +d.R3;
            d.R4 = +d.R4;
            d.R3_pairing = +d.R3_pairing;
            d.R4_pairing = +d.R4_pairing;
            d.golferId = +d.golferId;
            d.age = +d.age;
            d.overallPar = +d.overallPar;
        })

        let players = selectplayers(data);
        linegraph(data);
        countries(data);
        // worldmap(data);
        collegemap(data);
        // agegraph(data);
        // pairings(data);
    });
}

let convertPar = function(par) {
    if (par == 0) {return "E"}
    if (par > 0) {return "+" + par}
    if (par < 0) {return par}
}

let selectplayers = function(data) {
    // let menu = d3.selectAll("#player_menu")
    // menu.selectAll("option")
    //     .data(data)
    //     .enter()
    //     .append("option")
    //     .attr("value", d => d)
    //     .text(d => d.name);

    const player_width = 150;
    const player_size = 120;

    let players = d3.select("#leaderboard")
        .append("svg")
        .attr("width", player_width * 71.5)
        .attr("height", player_width + 100)
        .append("g")
        .attr("transform", `translate(30, 0)`);

    let player_profile = players.selectAll("image")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "player")
        .attr("status", false);

    player_profile.append("image")
        .attr("xlink:href", d => d.profile)
        .attr("x", (d, i) => i * player_width)
        .attr("y", 20)
        .attr("width", player_size)
        .attr("height", player_size);

    player_profile.append("text")
        .attr("class", "names")
        .html(d => d.name.split(" ")[0])
        .attr("x", (d, i) => i * player_width + player_size / 2)
        .attr("y", player_size + 40);

    player_profile.append("text")
        .attr("class", "names")
        .html(d => d.name.split(" ")[1] + " (" + convertPar(d.overallPar) + ")")
        .attr("x", (d, i) => i * player_width + player_size / 2)
        .attr("y", player_size + 55);

    // player_profile
    //     .on("mouseover", function(e, d) {
    //         d3.selectAll("g.player").style("opacity", 0.3)
    //         d3.select(this).style("opacity", 1)
    //     })
    //     .on("mouseout", function(e, d) {
    //         d3.selectAll("g.player").style("opacity", 1)
    //     });

}

let linegraph = function(data){

    let svg = d3.select("#dashboard")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    let tooltip = d3.select("#dashboard")
        .append("div")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("class", "tooltip")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("padding", "3px")


    let expand = [];
    let minY = 100;
    let maxY = 0;
    for (let i in data.slice(0, data.length)) {
        let scores = [data[i].R1, data[i].R2, data[i].R3, data[i].R4]
        let r1 = [data[i].name, "Round 1", scores[0]]
        let r2 = [data[i].name, "Round 2", scores[1]]
        let r3 = [data[i].name, "Round 3", scores[2]]
        let r4 = [data[i].name, "Round 4", scores[3]]
        expand.push(r1, r2, r3, r4)
        if (Math.min(...scores) < minY) {minY = Math.min(...scores)}
        if (Math.max(...scores) > maxY) {maxY = Math.max(...scores)}
    }

    console.log(expand);

    let xScale = d3.scaleBand().domain(["Round 1", "Round 2", "Round 3", "Round 4"]).range([0, width]);
    let yScale = d3.scaleLinear().domain([minY-3, maxY+3]).range([height, 0]);
    let xAxis = d3.axisBottom().scale(xScale);
    let yAxis = d3.axisLeft().scale(yScale);

    svg.append("g")
        .call(xAxis)
        .attr("class", "axes")
        .attr("transform", `translate(0, ${height})`);
        // .append("text")
        // .attr("transform", `translate(${width/2}, ${margin.bottom/1.5})`)
        // .style("text-anchor", "middle")
        // .attr("fill", "black")
        // .text("Round");

    svg.append("g")
        .call(yAxis)
        .attr("class", "axes")
        .attr("transform", `translate(0, 0)`)
        .append("text")
        .attr("transform", `translate(${-margin.left/1.5}, ${height/2}) rotate(-90)`)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .text("Round Scores");

    svg.append("g")
        .selectAll("circle.rounds")
        .data(expand)
        .enter()
        .append("circle")
        .attr("cx", d=>xScale(d[1]) + (xScale.bandwidth()/2))
        .attr("cy", d=>yScale(d[2]))
        .attr("r", 8)
        .attr("opacity", 0.2)
        .attr("fill", "#061b40");

    for (let i in data.slice(0, data.length)) {
        let player_line = d3.line()
            .x(d => xScale(d[1]) + (xScale.bandwidth()/2))
            .y(d => yScale(d[2]))
        svg.append("path")
            .datum(expand.filter(function(d) {return d[0] == data[i].name}))
            .attr("class", "player_line")
            .attr("d", player_line)
            .style("fill", "none")
            .style("stroke-width", 2)
            .style("stroke", "black")
            .style("stroke-opacity", 0.3)
            .on("mouseover", function(e, d) {
                d3.select(this)
                    .style("stroke-opacity", 1)
                    .style("stroke", "red")
                    .style("stroke-width", 4);
                tooltip
                    .html(data[i].name)
                    .style("opacity", 1)
                    .style("left", e.pageX + 20 + "px")
                    .style("top", e.pageY + "px")
                    .style("fill", "black")
                    .style("font-family", "Futura");
            })
            .on("mouseout", function(e, d){
                d3.selectAll(".player_line").style("stroke-opacity", 0.3).style("stroke", "black").style("stroke-width", 2);
                tooltip.style("opacity", 0);
            });
    }

    svg.append("text")
        .attr("class", "title")
        .attr("x", width/2)
        .attr("y", 0)
        .style("text-anchor", "middle")
        .text("Round Scores per Player");

    // when mouse hovers over line, show player's name as tooltip
}

let countries = function(data) {

    const countryFlags = {
        "United States": "flags/united-states.png",
        "Germany": "flags/germany.png",
        "Argentina": "flags/argentina.png",
        "Canada": "flags/canada.png",
        "Japan": "flags/japan.png",
        "South Korea": "flags/south-korea.png",
        "Spain": "flags/spain.png",
        "Australia": "flags/australia.png",
        "England": "flags/england.png",
        "Ireland": "flags/ireland.png",
        "South Africa": "flags/south-africa.png",
        "Venezuela": "flags/venezuela.png",
        "Italy": "flags/italy.png",
        "Chile": "flags/chile.png",
        "Northern Ireland": "flags/northern-ireland.png",
        "Scotland": "flags/scotland.png"
    }

    const flagScale = d3.scaleOrdinal().domain(Object.keys(countryFlags)).range(Object.values(countryFlags));

    let svg = d3.select("#dashboard")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    svg.append("text")
        .attr("class", "title")
        .attr("transform", `translate(${width/2}, ${margin.top})`)
        .style("text-anchor", "middle")
        .text("Countries Represented by the Players");

    const countryPos = {
        "Spain": {
            x: 500,
            y: 500
        },
        "South Africa": {
            x: 500,
            y: 700
        },
        "United States": {
            x: 150,
            y: 400
        },
        "Italy": {
            x: 700,
            y: 500
        },
        "England": {
            x: 600,
            y: 240
        },
        "Northern Ireland": {
            x: 450,
            y: 180
        },
        "Germany": {
            x: 600,
            y: 400
        },
        "Japan": {
            x: 900,
            y: 450
        },
        "South Korea": {
            x: 850,
            y: 250
        },
        "Argentina": {
            x: 250,
            y: 750
        },
        "Ireland": {
            x: 400,
            y: 220
        },
        "Chile": {
            x: 150,
            y: 700
        },
        "Australia": {
            x: 850,
            y: 700
        },
        "Venezuela": {
            x: 200,
            y: 650
        },
        "Canada": {
            x: 200,
            y: 120
        },
        "Scotland": {
            x: 700,
            y: 130
        }
    }

    const force = d3.forceSimulation(data)
        .force("x", d3.forceX().x(function(d) {
            return countryPos[d.country]['x']
        }).strength(0.1))
        .force("y", d3.forceY().y(function(d) {
            return countryPos[d.country]['y']
        }).strength(0.1))
        .force("collide", d3.forceCollide(25));

    const tooltip = d3.select("#dashboard")
        .append("div")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("class", "node_tooltip")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("padding", "3px");

    // const node = svg.append("g")
    //     .selectAll("circle")
    //     .data(data)
    //     .join("circle")
    //     .attr("r", 20)
    //     .style("fill", d => colorScale(d.country))
    //     .on("mouseover", function(e, d) {
    //         tooltip.style("opacity", 1)
    //             .style("fill", "black")
    //             .style("font-family", "Futura")
    //             .html(d.name + " (" + d.country + ")")
    //     })
    //     .on("mousemove", function(e, d) {
    //         tooltip
    //             .style("left", e.pageX + 20 + "px")
    //             .style("top", e.pageY + "px")
    //     })
    //     .on("mouseout", function(e, d) {
    //         tooltip.style("opacity", 0)
    //     });
    // force.on("tick", function() {
    //     node.attr("cx", d => d.x)
    //         .attr("cy", d => d.y);
    // })

    const node = svg.selectAll("g")
        .data(data)
        .enter()
        .append("g")
        .on("mouseover", function(e, d) {
            d3.select(this).style("border", "solid")
            tooltip.style("opacity", 1)
                .style("fill", "black")
                .style("font-family", "Futura")
                .html(d.name + " (" + convertPar(d.overallPar) + ")")
        })
        .on("mousemove", function(e, d) {
            tooltip
                .style("left", e.pageX + 20 + "px")
                .style("top", e.pageY + "px")
        })
        .on("mouseout", function(e, d) {
            tooltip.style("opacity", 0)
            d3.select(this).style("border", "none")
        });

    node.append("image")
        .attr("xlink:href", d => flagScale(d.country))
        .attr("height", "40")
        .attr("width", "40")
        .attr("x", -20)
        .attr("y", -20);

    force.on("tick", function() {
        node.attr("transform", d => `translate(${d.x}, ${d.y})`)
    });
}

// let worldmap = function(data) {
//     const projection = d3.geoNaturalEarth1().scale(200).translate([width/2, height/2]);
//     const pathgeo = d3.geoPath().projection(projection);
//
//     let svg = d3.select("#dashboard")
//         .append("svg")
//         .attr("width", width + margin.left + margin.right)
//         .attr("height", height + margin.top + margin.bottom)
//         .append("g")
//         .attr("transform", `translate(${margin.left}, ${margin.top})`);
//
//     d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(map => {
//         svg.selectAll(".worldpath")
//             .data(map.features)
//             .enter()
//             .append("path")
//             .attr("class", "worldpath")
//             .attr("d", pathgeo)
//             .style("opacity", 0.2)
//             .style("stroke", "white")
//     })
//
// }

let collegemap = function(data) {

    let svg = d3.select("#dashboard")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    let collegePlayers = data.filter(function(d) {return d.college != ""});
    let collegeCounts = d3.flatRollup(collegePlayers, v => v.length, d => d.college);
    console.log(collegePlayers);

    const projection = d3.geoNaturalEarth1().scale(200).translate([width/2, height/2]);
    const pathgeo = d3.geoPath().projection(projection);

    svg.append("text")
        .attr("class", "title")
        .attr("transform", `translate(${width/2}, ${margin.top})`)
        .style("text-anchor", "middle")
        .text("Colleges Attended by Fifty of the Seventy-One Players")

    const collegePos = {
        "Arizona State University": {
            lat: 33.4242,
            long: -111.9281
        },
        "University of Georgia": {
            lat: 33.9567,
            long: -83.3752
        },
        "Florida State University": {
            lat: 30.4419,
            long: -84.2985
        },
        "University of California, Berkeley": {
            lat: 37.8702,
            long: -122.2595
        },
        "San Diego State University": {
            lat: 32.7774,
            long: -117.0714
        },
        "University of Texas": {
            lat: 30.2849,
            long: -97.7341
        },
        "Kent State University": {
            lat: 41.1498,
            long: -81.3433
        },
        "Duke University": {
            lat: 36.0014,
            long: -78.9382
        },
        "UCLA": {
            lat: 34.0699,
            long: -118.4438
        },
        "Oklahoma State University": {
            lat: 36.1270,
            long: -97.0737
        },
        "Coastal Carolina University": {
            lat: 33.7961,
            long: -79.0137
        },
        "Augusta State University": {
            lat: 33.4757,
            long: -82.0225
        },
        "University of Alabama": {
            lat: 33.2114,
            long: -87.5401
        },
        "Iowa State University": {
            lat: 42.0267,
            long: -93.6465
        },
        "Tohoku Fukushi University": {
            lat: 38.2799,
            long: 140.8474
        },
        "Southern Methodist University": {
            lat: 32.8412,
            long: -96.7845
        },
        "Northwestern University": {
            lat: 42.0565,
            long: -87.6753
        },
        "Stanford University": {
            lat: 37.4275,
            long: -122.1697
        },
        "Korea National Sport University": {
            lat: 37.5196,
            long: 127.1310
        },
        "University of Nevada, Las Vegas": {
            lat: 36.1075,
            long: -115.1435
        },
        "McNeese State University": {
            lat: 30.1777,
            long: -93.2152
        },
        "Virgina Commonwealth University": {
            lat: 37.5527,
            long: -77.4527
        },
        "University of Houston": {
            lat: 29.7199,
            long: -95.3422
        },
        "Yonsei University": {
            lat: 37.5658,
            long: 126.9386
        },
        "Western Carolina University": {
            lat: 35.3090,
            long: -83.1864
        },
        "University of Louisville": {
            lat: 38.2123,
            long: -85.7585
        },
        "Texas Christian University": {
            lat: 32.7079,
            long: -97.3628
        },
        "University of Tennessee": {
            lat: 35.9544,
            long: -83.9295
        },
        "University of Las Palmas": {
            lat: 28.0731,
            long: -15.4515
        },
        "University of Kansas": {
            lat: 38.9543,
            long: -95.2558
        },
        "Georgia Tech": {
            lat: 33.7756,
            long: -84.3963
        },
        "Boise State University": {
            lat: 43.6029,
            long: -116.1999
        },
        "Athlone Institute of Technology": {
            lat: 53.4179,
            long: -7.9052
        },
        "United States Air Force Academy": {
            lat: 38.9984,
            long: -104.8618
        },
        "Baylor University": {
            lat: 31.5501,
            long: -97.1135
        }
    }

    for (let i in collegeCounts) {
        collegePos[collegeCounts[i][0]]["count"] = collegeCounts[i][1]
    }

    const tooltip = d3.select("#dashboard")
        .append("div")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("class", "node_tooltip")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("padding", "3px");

    function drawMap(geojson){
        let states = svg.selectAll("path").data(geojson.features);

        states.enter()
            .append("path")
            .attr("d", pathgeo)
            .attr("stroke", "#061b40")
            .attr("stroke-width", "1px")
            .attr("fill", "none");

        svg.selectAll("circle")
            .data(collegePlayers)
            .enter()
            .append("circle")
            .attr("cx", d => projection([collegePos[d.college]["long"], collegePos[d.college]["lat"]])[0])
            .attr("cy", d => projection([collegePos[d.college]["long"], collegePos[d.college]["lat"]])[1])
            .attr("r", d => collegePos[d.college]["count"] * 2)
            .attr("fill", "red")
            .attr("opacity", 0.5)
            .attr("stroke", "black")
            .attr("stroke-width", "1px")
            .on("mouseover", function(e, d) {
                tooltip
                    .html(d.college)
                    .style("fill", "black")
                    .style("font-family", "Futura")
                    .style("opacity", 1)
                    .style("left", e.pageX + 20 + "px")
                    .style("top", e.pageY + "px")
            })
            .on("mouseout", function(e, d) {
                tooltip.style("opacity", 0)
            });

        let zoom = d3.zoom()
            .scaleExtent([1, 5])
            .on("zoom", function(e) {
                svg.selectAll("path").attr("transform", e.transform);
                svg.selectAll("circle").attr("transform", e.transform);
            });

        svg.call(zoom);
    }

    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(function(json) {
        drawMap(json);
    })


}

