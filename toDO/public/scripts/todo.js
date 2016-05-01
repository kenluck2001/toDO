/**
Author: Kenneth Emeka Odoh
 */

var Comment = React.createClass({

	getInitialState: function () {
		//set the states for image source and visibility
		return {imgsrc: "images/nodelete.png", chkclass: "hidden"};
	},

	mouseOver: function () {
		//This provides for highlighting on a mouseover
		this.setState({imgsrc: "images/delete.png"});
		this.setState({chkclass: "visible"});
	},

	mouseOut: function () {
		//This provides for disabling the highlighting when the mouse leaves
		this.setState({imgsrc: "images/nodelete.png"});
		this.setState({chkclass: "hidden"});
	},

	handleCheckChange: function(e) {
		//manage the checkbox checked
		var selectedID = this.props.keyID;
		var updateActiveURL = '/api/text/update/active/';
		var active = 0;
		if ( e.target.checked  )
		{
			//highlight the term
			$("#"+selectedID).highlight( decodeURI(this.props.text) );
			
			//update the database
			$.ajax({
				url: updateActiveURL,
				type: "POST",
				data: { "id" : encodeURIComponent(selectedID), "active" : encodeURIComponent(active) },
				dataType: 'json',
				success: function(data) {

				}.bind(this),
				error: function(xhr, status, err) {
					console.log(err);
				}.bind(this)
			});
		}
		else
		{
			//disable the highlight
			$("#"+selectedID).removeHighlight();
			
			active = 1;

			//update the database
			$.ajax({
				url: updateActiveURL,
				type: "POST",
				data: { "id" : encodeURIComponent(selectedID), "active" : encodeURIComponent(active) },
				dataType: 'json',
				success: function(data) {

				}.bind(this),
				error: function(xhr, status, err) {
					console.log(err);
				}.bind(this)
			});
		}
	},

	onClick: function() {
		//deletes the term on a click
		var currentID = this.props.keyID;
		
		//update the database
		$.ajax({
			url: '/api/text/delete/',
			type: "POST",
			data: { "id" : encodeURIComponent(currentID) },
			dataType: 'json',
			success: function(data) {

			}.bind(this),
			error: function(xhr, status, err) {
				console.log(err);
			}.bind(this)
		});
		
		//retrieve results and update the summary statistics
		$.ajax({
			url: '/api/show',
			dataType: 'json',
			cache: false,
			success: function(data) {
				this.setState({data: data});
			}.bind(this),
			error: function(xhr, status, err) {
				console.log( err.toString() );
			}.bind(this)
		});
		
		
	},  

	
	_handleCurKeyPress : function(e) {
		//remove editing class
		var spanDiv = "#span" + this.props.keyID + " > p";
		if (e.key === 'Enter') {
			$( spanDiv ).removeClass( "editable" );

		}
	},

	onDoubleClick: function() {
		/**
		 * activate editing of term on double click and fire an ajax call after typing is stopped for some seconds
		 * This prevent repetitive query
		 */
		var currentID = this.props.keyID;
		
		var spanDiv = "#span" + this.props.keyID + " > p";
		

		$(spanDiv).dblclick(function()
		{
		    var $div=$(spanDiv), isEditable=$div.is('.editable');
		    $(spanDiv).prop('contenteditable',!isEditable).toggleClass('editable')
	
		    var typingTimer;                //timer identifier
		    var doneTypingInterval = 8000;  //time in ms, 8 second for example          
		 
		    $(spanDiv).keyup(function()
		    {
		        clearTimeout(typingTimer);
		        typingTimer = setTimeout(doneTyping, doneTypingInterval);
		    });
		         
		    $(spanDiv).keydown(function(){
		        clearTimeout(typingTimer);
		    });
		 
		 
		 
		    //user is "finished typing," do something
		    function doneTyping () 
		    {
		    	//var txt=$(".editable").text();
		    	var txt = $(spanDiv).text();
		        //get the user input and use it to fire an ajax call for the user event and use this to search
				$.ajax({
					url: '/api/text/update/text/',
					type: "POST",
					data: { "id" : encodeURIComponent(currentID), "text" : encodeURIComponent(txt) },
					dataType: 'json',
					success: function(data) {

					}.bind(this),
					error: function(xhr, status, err) {
						console.log(err);
					}.bind(this)
				});	
				
				//show the results and update the state
				
				$.ajax({
					url: '/api/show',
					dataType: 'json',
					cache: false,
					success: function(data) {
						this.setState({data: data});
					}.bind(this),
					error: function(xhr, status, err) {
						console.log(err.toString());
					}.bind(this)
				});
				
		    }

		})

		
	}, 

	rawMarkup: function() {
		var rawMarkup = marked(this.props.children.toString(), {sanitize: true});
		return { __html: rawMarkup };
	},

	render: function() {
		return ( 		

				<div id= {this.props.keyID} className="comment" onMouseOver = {this.mouseOver}  onMouseOut= {this.mouseOut} id={this.props.keyID} >
				<img src={this.state.imgsrc} className="imageDiv" onClick={this.onClick} />

				<span id= {"span" + this.props.keyID} dangerouslySetInnerHTML={this.rawMarkup()} onDoubleClick={this.onDoubleClick} onKeyPress = {this._handleCurKeyPress}  />

				<input type="checkbox" className={this.state.chkclass} onChange={this.handleCheckChange} />        
				</div>

		);
	}
});

var CommentBox = React.createClass({
	getInitialState: function() {
		return { smactive: 0, smnotactive: 0 };
	},
	
	loadCommentsFromServer: function() {
		//get the data from the server
		$.ajax({
			url: '/api/show',
			dataType: 'json',
			cache: false,
			success: function(data) {
				this.setState({data: data});
			}.bind(this),
			error: function(xhr, status, err) {
				console.log(err.toString());
			}.bind(this)
		});
	
		//get the summary
		$.ajax({
			url: '/api/summary',
			dataType: 'json',
			cache: false,
			success: function(data) {
				this.setState({smactive: data.active});
				this.setState({smnotactive: data.notactive});
			}.bind(this),
			error: function(xhr, status, err) {
				console.log(err.toString());
			}.bind(this)
		});
		
		
	},
	handleCommentSubmit: function(comment) {
		//submit the request to the server
		var comments = this.state.data;
		
		var text = comment.text;
		var active = comment.active;
		var score = comment.score;

		
		var currentURL = "/api/add";
		//add a new todo item to the database
		$.ajax({
			url: currentURL,
			dataType: 'json',
			type: 'POST',
			data: { "text" : encodeURIComponent(text), "active" :  encodeURIComponent(active), "score": encodeURIComponent(score) },
			success: function(data) {
				var newComments = comments.concat(data);
				this.setState({data: newComments});

			}.bind(this),
			error: function(xhr, status, err) {
				this.setState({data: comments});
				console.log( err.toString());
			}.bind(this)
		});
		
		//get the summary of the data and update the state
		$.ajax({
			url: '/api/summary',
			dataType: 'json',
			cache: false,
			success: function(data) {
				this.setState({smactive: data.active});
				this.setState({smnotactive: data.notactive});
			}.bind(this),
			error: function(xhr, status, err) {
				console.log(err.toString());
			}.bind(this)
		});
	},
	getInitialState: function() {
		return {data: []};
	},
	componentDidMount: function() {
		this.loadCommentsFromServer();
		setInterval(this.loadCommentsFromServer, this.props.pollInterval);
	},
	render: function() {
	    var active = this.state.smactive;
	    var notactive = this.state.smnotactive;
		return (
				<div className="commentBox">
				<h1>TODO LIST</h1>
				<h4> <small>Active: {active}           |         Completed: {notactive}</small> </h4>  

				<CommentForm onCommentSubmit={this.handleCommentSubmit} />
				<CommentList data={this.state.data}   />
				</div>
		);
	}
});

var CommentList = React.createClass({
	render: function() {
		var commentNodes = this.props.data.map(function(comment) {
			return (

					<Comment active={comment.active} score={comment.score} text = {comment.text} keyID={comment.id} key={comment.id}>
					{ decodeURI(comment.text)}
					</Comment>
			);
		});
		return (
				<div className="commentList">
				{commentNodes}
				</div>
		);
	}
});

var CommentForm = React.createClass({
	getInitialState: function() {
		return {text: '', active: 1, score: 0 };
	},
	
	
	handleTextChange: function(e) {
		this.setState({text: e.target.value});
	},
	
	
	handleSubmit: function(e) {
		//submit the result on clicking the enter key

		if (e.key === 'Enter') {
			
			var text = this.state.text.trim();
			var active = 1;
			var score = 0;	
			
			if (!text ) {
				return;
			}
			this.props.onCommentSubmit({text: text, active: active, score: score});
			this.setState({text: text, active: active, score: score});
		}


	},
	render: function() {
		return (
				<div className="commentForm">

					<input
					className="form-control input-lg"
					id = "resizedTextbox"
					type="text"
						placeholder="Write something..."
							value={this.state.text}
					onChange={this.handleTextChange}
					onKeyPress = {this.handleSubmit}
					/>
				</div>
		);
	}
});



ReactDOM.render(
		<CommentBox pollInterval={2000} />,
		document.getElementById('content')
		);
