var Quizz =
{
	init:function(sayMessage, questions)
	{
		this.sayMessage = sayMessage;
		this.allQuestions = questions;

		this.isActive = false;
		this.waitingForAnswer = false;
		this.questionCount = 0;
		this.currentQuestion = '';
		this.currentAnswer = '';
		this.availableQuestions = this.allQuestions;

		this.firstTimeout = null;
		this.secondTimeout = null;
		this.thirdTimeout = null;

		this.highscores = {};
	},


	begin:function()
	{
		this.sayMessage('Quizz is starting !');
		this.isActive = true;
		this.step();
	},


	step:function()
	{
		if(this.questionCount < 9)
		{
			this.questionCount++;
			this.askNewQuestion();
		}
		else
		{
			this.questionCount = 0;
			this.end();
		}
	},


	end:function()
	{
		this.isActive = false;
		this.sayMessage('End of the quizz !');

		// Sort highscores
		var tuples = [];
		for (var key in this.highscores) tuples.push([key, this.highscores[key]]);
		tuples.sort(function(a, b) { return a[1] < b[1] ? 1 : (a[1] > b[1] ? -1 : 0); });
		for(var i in tuples)
		{
			this.sayMessage('#' + (parseInt(i)+1) + ' - ' + tuples[i][0] + ' : ' + tuples[i][1] + (i == 0 ? ' - MVP !' : ''));
			if(parseInt(i) > 10) break;
		}
	},



	askNewQuestion:function()
	{
		if(this.availableQuestions.length < 1) this.availableQuestions = this.allQuestions;
		var index = Math.floor(Math.random()*this.availableQuestions.length);
		var currentLine = this.availableQuestions[index].split('*');
		availableQuestions = this.availableQuestions.splice(index, 1);

		this.currentQuestion = currentLine[0];
		this.currentAnswer = currentLine[1];


		this.sayMessage('New question !');
		this.sayMessage(this.currentQuestion);
		this.waitingForAnswer = true;

		var self = this;
		this.firstTimeout = setTimeout(function(){self.sayMessage('Only 20 seconds left !');}, 12000);
		this.secondTimeout = setTimeout(function(){self.sayMessage('Only 10 seconds left ! Hint : ' + self.currentAnswer.substring(0,2) + self.currentAnswer.replace(/./g, '*').substring(2));}, 22000);
		this.thirdTimeout = setTimeout(function(){self.questionAnsweredBy('');}, 32000);
	},


	receiveMessage:function(from, message)
	{
		if(this.isActive)
		{
			if(this.waitingForAnswer)
				if(format(message) == format(this.currentAnswer)) this.questionAnsweredBy(from);
		}
		else
		{
			var command = commandForMessage(message);
			if(command && command.name == 'quizz') this.begin();
		}
	},


	questionAnsweredBy:function(nick)
	{
		this.waitingForAnswer = false;
		clearTimeout(this.firstTimeout);
		clearTimeout(this.secondTimeout);
		clearTimeout(this.thirdTimeout);

		if(nick == '')
		{
			this.sayMessage('Nobody found the correct answer ! The correct answer was : ' + this.currentAnswer);
		}
		else
		{
			this.sayMessage('Well done ' + nick + ', the correct answer was ' + this.currentAnswer);
			this.highscores[nick] = this.highscores[nick] ? this.highscores[nick]+1 : 1;
		}

		this.step();
	}
}

// Turn 'Quizz' into something you can instantiate
var QuizzConstructor = Quizz.init;
for(var k in Quizz) QuizzConstructor.prototype[k] = Quizz[k];

module.exports = QuizzConstructor;



// Normalize the answers to a lowercase string without accents, spaces, or punctuations
function format(string)
{
	return string
  	.toLowerCase()
    .replace(/[àáâãä]/g, 'a')
    .replace(/[ç]/g, 'c')
    .replace(/[èéêë]/g, 'e')
    .replace(/[îï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùûü]/g, 'u')
    .replace(/[\s\.]/g, '');
}

// Parse a message such as ".command arg1 arg2", or return null if parsing fails
function commandForMessage(message)
{
	if(message[0] == '.')
	{
		var split = message.split(' ');	
		var name = split[0].substring(1);
        var arguments = '';
        if(split.length > 1) arguments = split.splice(0,1).join(' ');
        return {name: name, arguments: arguments};
	}

    return null;
}