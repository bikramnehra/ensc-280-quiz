(function(){

  var app = angular.module('quizApp', []);

  app.controller('QuizController', ['$scope', '$http', '$sce', function($scope, $http, $sce){
    $scope.quiz_data = null;
    $scope.quiz_names = null;
    $scope.score = 0;
    $scope.totalScore = 0;
    $scope.numCorrectAns = 0;
    $scope.isFirstAttempt = 1;
    $scope.prevQuesIndex = null;
    $scope.activeQuestion = -1;
    $scope.activeQuestionAnswered = 0;
    $scope.percentage = 0;
    $scope.easyQues = [];
    $scope.hardQues = [];
    $scope.switchFlag = 1;

    //for saving the results
    $scope.easyFirstTimeCorrect = 0;
    $scope.easySecondTimeCorrect = 0;
    $scope.hardFirstTimeCorrect = 0;
    $scope.hardSecondTimeCorrect = 0;

    $http.get('/static/config.json').then(function(config){
        $scope.quiz_data = config.data;
        $scope.quiz_names = Object.keys(config.data);
    });

    $scope.selectAnswer = function(qIndex, aIndex){
      var questionState = $scope.myQuestions[qIndex].questionState;

      // if this is a new question then reset isFirstAttempt flag and increment total score
      if ($scope.prevQuesIndex != qIndex) {
          $scope.isFirstAttempt = 1;
          // Calculating max achieveable score based on difficulty level
          if ($scope.myQuestions[qIndex].type == 'hard') {
            $scope.totalScore += 4;
          }
          else{
            $scope.totalScore += 2;
          }
      }

      if( questionState != 'answered' ) {
        $scope.myQuestions[qIndex].selectedAnswer = aIndex;
        var correctAnswer = $scope.myQuestions[qIndex].correct;
        $scope.myQuestions[qIndex].correctAnswer = correctAnswer;

        if( aIndex === correctAnswer) {
          $scope.numCorrectAns += 1;
          $scope.myQuestions[qIndex].correctness = 'correct';
          //if the question answered in first attempt give full marks
          if ($scope.isFirstAttempt){  
            if ($scope.myQuestions[qIndex].type == 'hard') {
                $scope.score += 4;
                $scope.hardFirstTimeCorrect += 1;
            }
            else{
                $scope.score += 2;
                $scope.easyFirstTimeCorrect += 1;
            }
          }
          //if the question not answered in first attempt give half marks
          else{
            if ($scope.myQuestions[qIndex].type == 'hard') {
                $scope.score += 2;
                $scope.hardSecondTimeCorrect += 1;
            }
            else{
                $scope.score += 1;
                $scope.easySecondTimeCorrect += 1;
            }
          }
          $scope.myQuestions[qIndex].questionState = 'answered';
        } 
        //if question is incorrect then do these actions
        else {
          $scope.myQuestions[qIndex].correctness = 'incorrect';
          if ($scope.isFirstAttempt){
              $scope.myQuestions[qIndex].questionState = 'unanswered';
              $scope.myQuestions[qIndex].correctness = 'incorrectFirstAttempt';
              $scope.isFirstAttempt = 0;
              $scope.prevQuesIndex = qIndex;
          }
          else{
            $scope.myQuestions[qIndex].questionState = 'answered';
          }
        }
      }

      $scope.percentage = (($scope.score / $scope.totalScore)*100).toFixed(2);

      if ($scope.switchFlag && parseFloat($scope.percentage) > 20) {
          $scope.myQuestions.splice(qIndex+1);
          var numHardQues = $scope.totalQuestions - ($scope.activeQuestion+1);
          for (var i = 1; i <= numHardQues; i++) {
              $scope.myQuestions.splice(qIndex+i, 0, $scope.hardQues[i-1]);
          }
          $scope.switchFlag = 0;
      }
    }

    $scope.isSelected = function(qIndex, aIndex){
      return $scope.myQuestions[qIndex].selectedAnswer === aIndex;
    }

    $scope.isCorrect = function(qIndex, aIndex){
      if ($scope.myQuestions[qIndex].questionState === 'unanswered'){
         return null;
      }
      else{
        return $scope.myQuestions[qIndex].correctAnswer === aIndex;
      }
    }

    $scope.selectContinue = function(){
      $scope.activeQuestion += 1;
      if ($scope.totalQuestions === $scope.activeQuestion){
          $scope.saveResults();
      }
      return $scope.activeQuestion;
    }

    $scope.selectQuiz = function(quiz_name){
        var filename = $scope.quiz_data[quiz_name];
        $http.get('/static/quiz_data/'+filename).then(function(quizData){
        $scope.myQuestions = quizData.data;
        $scope.myQuestions.forEach(function(q){
            if (q.type === "easy") {
                $scope.easyQues.push(q);
            }
            else if (q.type === "hard"){
                $scope.hardQues.push(q);
            }
        })
        $scope.myQuestions = $scope.easyQues;
        $scope.totalQuestions = $scope.myQuestions.length;
      });

      $scope.activeQuestion = 0;
    }

     $scope.saveResults = function () {
            var d = new Date();
            var n = d.toDateString();
            var resultsData = {
                               "TimeStamp": n,
                               "Student Name": $scope.studentName,
                               "Student Number": $scope.studentNum,
                               "First Time Correct(Easy)": $scope.easyFirstTimeCorrect,
                               "Second Time Correct(Easy)": $scope.easySecondTimeCorrect,
                               "First Time Correct(Hard)": $scope.hardFirstTimeCorrect,
                               "Second Time Correct(Hard)": $scope.hardSecondTimeCorrect
                              }
            console.log(resultsData);

            $http.post('/saveResults', resultsData, {
                //transformRequest: angular.identity,
                //headers: {'Content-Type': undefined}
            })
            .success(function(data){
                console.log('Success!!!');
            })
            .error(function(){
                console.log('Error!!!');
            });
      }

  }]);

})();