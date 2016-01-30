var defaultAvatar = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Avatar_Picol_icon.svg/2000px-Avatar_Picol_icon.svg.png"


var ForceGraph = function (where) {

	//console.log(where);

	var that= this;

	this.usingAvatar=true;

	this.userProfiles = [];
	this.config = {avatarSize:90};

	this.tempLinks = [];
	this.tempToRemove = [];
	this.tempRemoved = [];

	this.activeAction = 'link_retweetters';

	this.container = d3.select(where);

	this.svgW = 1000;
	this.svgH = 1000;
	this.svgR = 0;
	this.svgT = 0;
	this.padding = 1.5;

	this.maxRadius = this.config.avatarSize;

	this.svg = this.container.append("svg").style("width","100%").style("height","100%")
	.attr("viewBox",this.svgR+" "+this.svgT+" "+this.svgW+" "+this.svgH);
	this.defs = this.svg.append("svg:defs");

	var grad = this.defs.append("defs").append("linearGradient").attr("id", "both")
	.attr("x1", "0%").attr("x2", "0%").attr("y1", "100%").attr("y2", "0%");
	grad.append("stop").attr("offset", "50%").style("stop-color", "#779ECB");
	grad.append("stop").attr("offset", "50%").style("stop-color", "#C23B22");

	this.collide = function (alpha) {
		var quadtree = d3.geom.quadtree(that.nodes);
		return function(d) {
			var r = d.radius + that.maxRadius + that.padding,
			nx1 = d.x - r,
			nx2 = d.x + r,
			ny1 = d.y - r,
			ny2 = d.y + r;
			quadtree.visit(function(quad, x1, y1, x2, y2) {
				if (quad.point && (quad.point !== d)) {
					var x = d.x - quad.point.x,
					y = d.y - quad.point.y,
					l = Math.sqrt(x * x + y * y),
					r = d.radius + quad.point.radius + that.padding;
					if (l < r) {
						l = (l - r) / l * alpha;
						d.x -= x *= l;
						d.y -= y *= l;
						quad.point.x += x;
						quad.point.y += y;
					}
				}
				return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
			});
		}
	};


	this.tick = function(){
		that.link.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });

		that.node.each(that.collide(0.5))
		.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
	}


	this.force = d3.layout.force()
	.size([this.svgW, this.svgH])
	.nodes(this.userProfiles)
	.linkDistance(this.config.avatarSize*2+this.padding)
	.charge(-800)
	.gravity(0.07)
	.on("tick", this.tick)
	.start();

	this.nodes = this.force.nodes();
	this.links = this.force.links();
	this.node = this.svg.selectAll(".node");
	this.link = this.svg.selectAll(".link");



}

ForceGraph.prototype.restart = function () {
	console.log('RESTART');
	var that = this;

	this.link = this.link.data(this.links);

	this.link.enter().insert("line", ".node")
	.attr("class", "link");

	this.link.exit().remove();

		//Update links
		this.link.attr('class', function (d) {
			if(d.source.mentioned_screen_name != '') {
				return 'link mention';
			} else if (d.source.retweetted_screen_name != '') {
				return 'link retweet';
			} else {
				return 'link';
			}
		});

		this.node = this.node.data(this.nodes);

		this.node.exit().remove();

	// Nodes to Modify

	var g = this.node
	.attr("class", "node")
	;

	g.select("circle")
	.attr("class",function(d) { return d.player;})
	.style("fill", this.usingAvatar?function(d) { return "url(#"+d.id+")"}:null)

	g.select("text")
	.text(function(d){ return d.name});



	// New Nodes
	var g = this.node.enter().append("g")
	.attr("class", "node")
	.call(this.force.drag);

	g.append("circle")
	.attr("class",function(d) { return d.player})
	.style("fill", this.usingAvatar?function(d) { return "url(#"+d.id+")"}:null)
	.attr("cx", 0)
	.attr("cy", 0)
	.attr("r", function (d) {
		if(d.node_level == 0) {
			return that.config.avatarSize/2;
		} else if (d.node_level == 1){
			return that.config.avatarSize/3;
		} else {
			return that.config.avatarSize/4;
		}
	})
	.on('click', function(d) {
		console.log(d);
		//getTweetsByScreenName(d.screen_name,2);
		//getTweetsByMention(d.screen_name);
	})
	.on('dblclick', function(d) {
		d.expanded = true;
		getTweetsByScreenName(d.screen_name,1);
		console.log(that.activeAction);
		switch(that.activeAction) {
			case 'link_mentioners':
			{
				getTweetsByMention(d.screen_name, d.node_level);
				break;
			}
			case 'link_retweetters':
			{
				getLastTweetRetweetsByScreenName(d.screen_name, d.node_level);
				break;
			}
			case 'delete_cascade':
			{
				that.deleteFirstNodeCascade(d);
				break;
			}
			case 'delete':
			{
				that.deleteNode(d);
				break;
			}
			case 'force_link':
			{
				break;
			}
		}

	});

	g.append("text")
	.attr("class","avatar-text")
	.attr("y",this.config.avatarSize/2+this.padding)
	.attr("text-anchor","middle")
	.attr("dominant-baseline","hanging")
	.text(function(d){ return d.name});

	this.node.attr('class', function (d) {
		if(d.expanded) {
			return 'node expanded';
		} else {
			return 'node';
		}
	});

	this.force.start();

};

ForceGraph.prototype.removeUserProfile = function(userProfile,p) {
	console.log('inRemove');

	var alreadyThere = false;
	var oldNode;
	for (var i in this.nodes){
		var n = this.nodes[i];
		if (n.id == userProfile.id){
			alreadyThere=true;
			oldNode = n;
			var oldNodeIndex = i;
		}
	}

	if (alreadyThere) {
		if (oldNode.player.indexOf("player" + p)!=-1) {
			console.log('inDeepRemove');
			var start = oldNode.player.indexOf("player" + p)==0?8:0
			var end = oldNode.player.indexOf("player" + p)==0?15:7
			oldNode.player = oldNode.player.slice(start,end);
				// Remove the node
				var j=0;
				while (j<this.links.length) {
					var l = this.links[j];
					if (l.source==oldNode || l.target==oldNode) {
						this.links.splice(j,1);
					} else {
						j += 1;
					}
				}

				this.nodes.splice(oldNodeIndex,1);
				cleanDataset(userProfile.screen_name);
				this.restart();
			}

		}


	}

	ForceGraph.prototype.addUserProfile = function(userProfile, nodeLevel ,p) {
		var userProfileNode = userProfile;

		var alreadyThere = false;
		var oldNode;
		for (var i in this.nodes){
			var n = this.nodes[i];
			if (n.id == userProfile.id){
				alreadyThere=true;
				oldNode = n;
			}
		}

		if (!alreadyThere){
			var badLink= "http://userserve-ak.last.fm/"
			var avatar = null;
			var url = userProfile.profile_image_url_https;
			avatar = url;

		this.defs.append("svg:pattern")
		.attr("id", userProfile.id)

		.attr("width", "100%")
		.attr("height", "100%")
		.attr("patternContentUnits", "objectBoundingBox")
		.append("svg:image")
		.attr("xlink:href", avatar?avatar:defaultAvatar)
		.attr("width", 1)
		.attr("height", 1)
		.attr("preserveAspectRatio","none");



		userProfileNode.x = Math.random()*this.svgW;
		userProfileNode.y = Math.random()*this.svgH;
		userProfileNode.radius = this.config.avatarSize/2;
		userProfileNode.player = "player" + p;
		if(!userProfileNode.hasOwnProperty('mentioned_screen_name')) {
			userProfileNode.mentioned_screen_name = '';
		}
		if(!userProfileNode.hasOwnProperty('retweetted_screen_name')) {
			userProfileNode.retweetted_screen_name = '';
		}
		userProfileNode.node_level = nodeLevel;
		userProfileNode.expanded = false;
		this.nodes.push(userProfileNode);


		for (var i in this.nodes) {
			var a2 = this.nodes[i];
			if (a2.screen_name == userProfile.mentioned_screen_name){
				this.links.push({source:userProfileNode,target:a2});
			} else if (a2.screen_name == userProfile.retweetted_screen_name) {
				this.links.push({source:userProfileNode,target:a2});
			}
		}

		this.restart();
	}else {
		if (oldNode.player.indexOf("player" + p)==-1){
			oldNode.player += " player" + p;
			this.node.selectAll("circle").attr("class", function(d){ return d.player });
		}

		for (var i in this.nodes) {
			var exist = false;
			var a2 = this.nodes[i];
			if (a2.screen_name == userProfile.mentioned_screen_name){
				for(var j in this.links) {
					if(this.links[j].source.screen_name == userProfileNode.screen_name && this.links[j].target.screen_name == a2.screen_name) {
						exist = true;
						break;
					}
				}
				if(!exist) {
					this.links.push({source:oldNode,target:a2});
				}
			} else if (a2.screen_name == userProfile.retweetted_screen_name) {
				for(var j in this.links) {
					if(this.links[j].source.screen_name == userProfileNode.screen_name && this.links[j].target.screen_name == a2.screen_name) {
						exist = true;
						break;
					}
				}
				if(!exist) {
					this.links.push({source:oldNode,target:a2});
				}
			}
		}
		console.log(this.links);
		this.restart();
	}
}

ForceGraph.prototype.addMentionersNodes = function (mentionedScreenName, mentionedNodeLevel, mentionerTweets) {
	for(var i in mentionerTweets.statuses) {
		mentionerTweets.statuses[i].user.mentioned_screen_name = mentionedScreenName;
		this.addUserProfile(mentionerTweets.statuses[i].user, mentionedNodeLevel + 1);
	}
};

ForceGraph.prototype.addRetweettersNodes = function (retweettedScreenName, retweettedNodeLevel, retweetterTweets) {
	for(var i in retweetterTweets) {
		retweetterTweets[i].user.retweetted_screen_name = retweettedScreenName;
		this.addUserProfile(retweetterTweets[i].user, retweettedNodeLevel + 1);
	}
};


ForceGraph.prototype.deleteNode = function (node) {
	this.removeUserProfile(node);
};

ForceGraph.prototype.deleteFirstNodeCascade = function (node) {
	this.tempLinks = this.links;
	console.log(this.tempLinks);
	if(this.tempLinks.length > 0) {
		for (var i=0; i < this.tempLinks.length; i++) {
			console.log('CONTROLLO1');
			console.log(i);
			if(this.tempLinks[i].target.screen_name == node.screen_name && this.tempLinks[i].target.node_level <= node.node_level) {
				if(!this.nodeInArray(this.tempLinks[i].source, this.tempToRemove)) {
					this.tempToRemove.push(this.tempLinks[i].source);
					//this.tempLinks.splice(i,1);
					this.deleteNodeCascade(this.tempLinks[i].source);
				}
			}
		}
	}
	console.log(node);
	this.tempToRemove.push(node);

	for(i in this.tempToRemove) {
		this.removeUserProfile(this.tempToRemove[i]);
	}

  this.tempToRemove = [];
};

ForceGraph.prototype.deleteNodeCascade = function (node) {
	console.log(this.tempLinks);
	if(this.tempLinks.length > 0) {
		for (var i=0; i < this.tempLinks.length; i++) {
			console.log('CONTROLLO2');
			console.log(i);
			if(this.tempLinks[i].target.screen_name == node.screen_name && this.tempLinks[i].target.node_level <= node.node_level) {
				if(!this.nodeInArray(this.tempLinks[i].source, this.tempToRemove)) {
					this.tempToRemove.push(this.tempLinks[i].source);
					this.deleteNodeCascade(this.tempLinks[i].source);
				}
			}
		}
	}
	console.log(node);
};

ForceGraph.prototype.nodeInArray = function(node, array) {
	console.log(array);
	for(var i in array) {
		if(array[i].screen_name == node.screen_name) {
			return true;
		}
	}
	return false;
};

ForceGraph.prototype.removeLinks = function (screenNames) {
	for(var i in screenNames) {
		for(var j in this.links) {
			if(this.links[j].source.screen_name == screenNames[i] || this.links[j].target.screen_name == screenNames[i]) {
				this.links.splice(j,1);
			}
		}
	}
};

ForceGraph.prototype.setAction =  function (action) {
	this.activeAction = action;
	console.log(this.activeAction);
};

ForceGraph.prototype.resizeForceGraph =  function (amount) {
	this.svgR = this.svgR - amount/4;
	this.svgT = this.svgT - amount/4;
	this.svgW = this.svgW + amount;
	this.svgH = this.svgH + amount;
	this.svg.attr("viewBox", this.svgR+" "+this.svgT+" "+this.svgW+" "+this.svgH);
};

ForceGraph.prototype.generateUserDataset = function () {
	return this.nodes;
};
