// C:\LMS App copy Part 2\Lms-App - Copy\new-client\app\(routes)\quiz-session\index.tsx

import React, { useState, useEffect } from 'react'; // MODIFICATION: Added useEffect to the import
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Toast } from 'react-native-toast-notifications';
import axios from 'axios';
import { SERVER_URI } from '@/utils/uri';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Results = {
  [questionId: string]: {
    isCorrect: boolean;
    correctAnswer: string;
  };
};

export default function QuizSessionScreen() {
  // MODIFICATION: Correctly retrieve submissionDataString from params
  const { quizData: quizDataString, courseId, submissionData: submissionDataString } = useLocalSearchParams();
  const quiz: IQuiz | null = quizDataString ? JSON.parse(quizDataString as string) : null;
  // MODIFICATION: Define the existingSubmission variable
  const existingSubmission: ISubmission | null = submissionDataString ? JSON.parse(submissionDataString as string) : null;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<Results | null>(null);

  useEffect(() => {
    if (existingSubmission && quiz) {
        const initialAnswers: { [key: string]: string } = {};
        // Ensure answers is an array before calling forEach
        (existingSubmission.answers || []).forEach((ans: any) => {
            initialAnswers[ans.questionId] = ans.selectedOption;
        });
        setSelectedAnswers(initialAnswers);

        const resultsData: Results = {};
        quiz.questions.forEach((q: IQuizQuestion) => {
            const userAnswer = initialAnswers[q._id];
            resultsData[q._id] = {
                isCorrect: userAnswer === q.correctAnswer,
                correctAnswer: q.correctAnswer,
            };
        });
        setResults(resultsData);
    }
  }, [existingSubmission, quiz]); // Dependency array is now correct

  if (!quiz) {
    return <View style={styles.container}><Text>Failed to load quiz.</Text></View>;
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  const handleSelectOption = (option: string) => {
    if (results) return;
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion._id]: option,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const finalAnswers = quiz.questions.map((q: IQuizQuestion) => ({
        questionId: q._id,
        selectedOption: selectedAnswers[q._id] || ""
    }));

    try {
        const accessToken = await AsyncStorage.getItem("access_token");
        const refreshToken = await AsyncStorage.getItem("refresh_token");
        const response = await axios.post(`${SERVER_URI}/submit-quiz`, {
            courseId,
            quizId: quiz.quizId,
            answers: finalAnswers
        }, { headers: { "access-token": accessToken, "refresh-token": refreshToken }});

        const { score, totalQuestions } = response.data;

        const resultsData: Results = {};
        quiz.questions.forEach((q: IQuizQuestion) => {
            const isCorrect = selectedAnswers[q._id] === q.correctAnswer;
            resultsData[q._id] = {
                isCorrect,
                correctAnswer: q.correctAnswer,
            };
        });
        
        setResults(resultsData);
        Toast.show(`You scored ${score} out of ${totalQuestions}!`, { type: 'success' });

    } catch (error: any) {
        const message = error.response?.data?.message || "Failed to submit quiz. Please try again.";
        Toast.show(message, { type: 'danger' });
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (results) {
    const score = Object.values(results).filter(r => r.isCorrect).length;
    return (
        <LinearGradient colors={["#E5ECF9", "#F6F7F9"]} style={styles.container}>
            <ScrollView contentContainerStyle={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>{existingSubmission ? "Your Previous Results" : "Quiz Results"}</Text>
                <Text style={styles.scoreText}>You Scored: {score} / {quiz.questions.length}</Text>
                {quiz.questions.map((q: IQuizQuestion) => {
                    const result = results[q._id];
                    const selected = selectedAnswers[q._id];
                    return (
                        <View key={q._id} style={styles.questionContainer}>
                            <Text style={styles.questionText}>{q.questionText}</Text>
                            {q.options.map((opt: IQuizOption, index: number) => {
                                const isSelected = selected === opt.optionText;
                                const isCorrect = result.correctAnswer === opt.optionText;
                                let optionStyle: StyleProp<ViewStyle> = styles.optionButton;
                                if (isSelected && !result.isCorrect) optionStyle = [styles.optionButton, styles.incorrectOption];
                                if (isCorrect) optionStyle = [styles.optionButton, styles.correctOption];
                                
                                return (
                                    <View key={index} style={optionStyle}>
                                        <Text style={styles.optionText}>{opt.optionText}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    )
                })}
                <TouchableOpacity style={styles.button} onPress={() => router.back()}>
                    <Text style={styles.buttonText}>Finish</Text>
                </TouchableOpacity>
            </ScrollView>
        </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#E5ECF9", "#F6F7F9"]} style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 15 }}>
        <Text style={styles.quizTitle}>{quiz.title}</Text>
        <Text style={styles.progressText}>Question {currentQuestionIndex + 1} of {quiz.questions.length}</Text>
        
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
          {currentQuestion.options.map((option: IQuizOption, index: number) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedAnswers[currentQuestion._id] === option.optionText && styles.selectedOption
              ]}
              onPress={() => handleSelectOption(option.optionText)}
            >
              <Text style={styles.optionText}>{option.optionText}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {currentQuestionIndex < quiz.questions.length - 1 ? (
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.button, isSubmitting && styles.disabledButton]} onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit</Text>}
          </TouchableOpacity>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 50 },
    quizTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
    progressText: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 20 },
    questionContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 10, marginBottom: 20, elevation: 3 },
    questionText: { fontSize: 18, fontWeight: '600', marginBottom: 15 },
    optionButton: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 15, marginBottom: 10 },
    selectedOption: { backgroundColor: '#d0e0ff', borderColor: '#2467EC' },
    optionText: { fontSize: 16 },
    button: { backgroundColor: '#2467EC', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    disabledButton: { backgroundColor: '#A9A9A9' },
    // Results Styles
    resultsContainer: { padding: 15 },
    resultsTitle: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    scoreText: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 25 },
    correctOption: { backgroundColor: '#c8e6c9', borderColor: '#4CAF50' },
    incorrectOption: { backgroundColor: '#ffcdd2', borderColor: '#f44336' },
});