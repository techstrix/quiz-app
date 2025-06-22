import {  useEffect, useState } from "react";
import useSWR from "swr";
import "./App.css"

//Fisher yates algorithm to randomly sort  our array
const randomizeAnswers = (array:Array<string>) :Array<string> => {
    const arrayCopy = [...array];
    for(let i=arrayCopy.length-1;i>0;i--){
        const randomIndex = Math.floor(Math.random()*(i+1));
        [arrayCopy[i],arrayCopy[randomIndex]] = [arrayCopy[randomIndex],arrayCopy[i]];
        
    }
    return arrayCopy;
  }

export default function App() {
  const url = "https://opentdb.com/api.php?amount=5&category=22&difficulty=hard&type=multiple";
  const fetcher = (url: string) => fetch(url).then((res) => res.json());
  const { data, isLoading, error } = useSWR(url, fetcher);
  const [currentQuestion, setCurrentQuestion] = useState<number>(1);
  const [answers,setAnswers] = useState<Array<string>>([]);
  const [selectedAnswer,setSelectedAnswer] = useState<string>();
  const [score,setScore] = useState<number>(0);
  const [questionHistory,setQuestionHistory] = useState<Array<{selected:string,questionIndex:number}>>([])
 const [randomizedQuestions, setRandomizedQuestions] = useState<Array<Array<string>>>([]);
  useEffect(() => {
    if (data && data.results && randomizedQuestions.length === 0) {
      // Randomize all questions only once when data is loaded
      const initialRandomized = data.results.map((result: resultObject) =>
        randomizeAnswers([...result.incorrect_answers, result.correct_answer])
      );
      setRandomizedQuestions(initialRandomized);
      setAnswers(initialRandomized[0]); // Set initial answers
    }
  }, [data]); // Only runs when data changes initially

  useEffect(() => {
    if (randomizedQuestions.length > 0 && data && data.results) {
      // Set answers based on current question without re-randomizing
      setAnswers(randomizedQuestions[currentQuestion - 1]);
      
      // Restore previous state if exists
      const history = questionHistory.find((h) => h.questionIndex === currentQuestion - 1);
      if (history) {
        setSelectedAnswer(history.selected);
        // Avoid re-scoring on revisit
      } else {
        setSelectedAnswer(undefined);
      }
    }
  }, [currentQuestion, randomizedQuestions, data]); // Runs when question changes





  type resultObject = {
    type: string;
    difficulty: string;
    category: string;
    question: string;
    correct_answer: string;
    incorrect_answers: Array<string>;
  };

 

  if (error) {
    console.log(error)
    return <div>Error loading data.</div>;
  }

  if (isLoading || !data || !data.results) {
    return <h1>Loading....</h1>;
  }
    const correctAnswer = data.results[currentQuestion - 1].correct_answer;


  return (
    <div className="main__container">
    <h1 className="score__card">Score:{score}</h1>
      <h1>
        Question {currentQuestion}/{data.results.length}
      </h1>
      <h2 style={{fontSize:"20px"}}>{data.results[currentQuestion - 1].question}</h2>

     

      <h3>Options</h3>

    
      {answers.map((answer) => {
        let bg:string = "";
        if(selectedAnswer){
        
          if(answer === selectedAnswer){

          bg = selectedAnswer === correctAnswer?"green":"red";
        }
      }
      return(
        <ul style={{listStyleType:"none"}}>
          <li><button style={{background:bg}} className="answer__buttons" onClick={() => {
            setSelectedAnswer(answer);
            if(answer === correctAnswer){
              setScore((prev) => prev+1);
      setQuestionHistory((prev) => {
        // if (!prev) return prev;
        const existing = prev?.find((question) => question.questionIndex === currentQuestion - 1);
        if (existing) {
          return prev?.map((h) =>
            h.questionIndex === currentQuestion - 1
              ? { ...h, selected: answer, scored: answer === correctAnswer }
              : h
          );
        } else {
          return [
            ...(prev || []),
            { selected: answer, questionIndex: currentQuestion - 1, scored: answer === correctAnswer }
          ];
        }
      });
            }
            
            
            }} >{answer}</button></li>
        </ul>
      )})}

     {selectedAnswer && selectedAnswer!==correctAnswer? <h1>Correct answer is {correctAnswer}</h1>:selectedAnswer&&selectedAnswer===correctAnswer?<h1>You got it bro</h1>:null}
      
      <div className="directionButtons__container">
      <button onClick={() => {setCurrentQuestion(currentQuestion - 1);setSelectedAnswer("")}} className="direction__button" disabled={currentQuestion - 1 === 0}>
        Previous
      </button>
      <button onClick={() => {setCurrentQuestion(currentQuestion + 1);setSelectedAnswer("");}} disabled={currentQuestion + 1 > data.results.length} className="direction__button">
        Next
      </button>
      </div>
    </div>
  );
}
