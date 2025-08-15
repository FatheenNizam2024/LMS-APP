// C:\LMS App copy Part 2\Lms-App - Copy\admin\app\components\Admin\Course\CourseData.tsx

import { styles } from "@/app/styles/style";
import React, { FC } from "react";
import { AiOutlineDelete, AiOutlinePlusCircle } from "react-icons/ai";
import { toast } from "react-hot-toast";

type QuizEditorProps = {
  quizzes: any[];
  path: { moduleIndex?: number; lessonIndex?: number };
  handleQuizChange: (path: any, field: string, value: any) => void;
  removeQuiz: (quizIndex: number, moduleIndex?: number, lessonIndex?: number) => void;
  addQuizQuestion: (path: any) => void;
  removeQuizQuestion: (path: any) => void;
  addQuizOption: (path: any) => void;
  removeQuizOption: (path: any) => void;
};

const QuizEditor: FC<QuizEditorProps> = ({
  quizzes,
  path,
  handleQuizChange,
  removeQuiz,
  addQuizQuestion,
  removeQuizQuestion,
  addQuizOption,
  removeQuizOption,
}) => (
  (quizzes || []).map((quiz: any, quizIndex: number) => (
    <div key={quiz.quizId || quizIndex} className="relative p-3 border my-3 rounded-md bg-indigo-100 dark:bg-indigo-900/30">
      <AiOutlineDelete className="absolute top-2 right-2 text-red-500 cursor-pointer" onClick={() => removeQuiz(quizIndex, path.moduleIndex, path.lessonIndex)} />
      <input type="text" placeholder="Quiz Title..." className={`${styles.input} my-2 !text-xl`} value={quiz.title} onChange={(e) => handleQuizChange({ ...path, quizIndex }, 'title', e.target.value)} />
      
      {(quiz.questions || []).map((question: any, questionIndex: number) => (
        <div key={question._id || questionIndex} className="relative p-2 border my-2 rounded bg-white dark:bg-slate-800">
          <AiOutlineDelete className="absolute top-2 right-2 text-red-500 cursor-pointer" onClick={() => removeQuizQuestion({ ...path, quizIndex, questionIndex })} />
          <textarea placeholder="Question Text..." className={`${styles.input} my-2 !h-20`} value={question.questionText} onChange={(e) => handleQuizChange({ ...path, quizIndex, questionIndex }, 'questionText', e.target.value)} />
          
          <h5 className="font-semibold text-gray-800 dark:text-gray-200 mt-2">Options:</h5>
          {(question.options || []).map((option: any, optionIndex: number) => (
            <div key={option._id || optionIndex} className="flex items-center my-1">
              <input type="radio" name={`correct_answer_${quiz.quizId}_${question._id}`} value={option.optionText} checked={question.correctAnswer === option.optionText} onChange={() => handleQuizChange({ ...path, quizIndex, questionIndex }, 'correctAnswer', option.optionText)} />
              <input type="text" placeholder={`Option ${optionIndex + 1}`} className={`${styles.input} ml-2`} value={option.optionText} onChange={(e) => handleQuizChange({ ...path, quizIndex, questionIndex, optionIndex }, 'optionText', e.target.value)} />
              <AiOutlineDelete className="text-red-500 cursor-pointer ml-2" onClick={() => removeQuizOption({ ...path, quizIndex, questionIndex, optionIndex })}/>
            </div>
          ))}
          <button type="button" onClick={() => addQuizOption({ ...path, quizIndex, questionIndex })} className="text-blue-500 mt-2 hover:text-blue-700">+ Add Option</button>
        </div>
      ))}
      <button type="button" onClick={() => addQuizQuestion({ ...path, quizIndex })} className="text-indigo-600 dark:text-indigo-400 mt-2 hover:text-indigo-800">
        <AiOutlinePlusCircle className="inline-block mr-2" /> Add Question
      </button>
    </div>
  ))
);

type Props = {
  courseContent: any;
  setCourseContent: (courseContent: any) => void;
  active: number;
  setActive: (active: number) => void;
  handleSubmit: any;
};

const CourseData: FC<Props> = ({
  courseContent,
  setCourseContent,
  active,
  setActive,
  handleSubmit: handleCourseSubmit,
}) => {
  
  const handleModuleTitleChange = (moduleIndex: number, value: string) => {
    setCourseContent((prev: any) => ({
      ...prev,
      modules: prev.modules.map((m: any, i: number) => 
        i === moduleIndex ? { ...m, title: value } : m
      ),
    }));
  };

  const handleLessonChange = (moduleIndex: number, lessonIndex: number, name: string, value: any) => {
    setCourseContent((prev: any) => ({
      ...prev,
      modules: prev.modules.map((m: any, i: number) => 
        i === moduleIndex ? {
          ...m,
          lessons: m.lessons.map((l: any, j: number) =>
            j === lessonIndex ? { ...l, [name]: value } : l
          ),
        } : m
      ),
    }));
  };

  const handleResourceChange = (moduleIndex: number, lessonIndex: number, resourceIndex: number, name: string, value: any) => {
    setCourseContent((prev: any) => ({
      ...prev,
      modules: prev.modules.map((m: any, i: number) =>
        i === moduleIndex ? {
          ...m,
          lessons: m.lessons.map((l: any, j: number) =>
            j === lessonIndex ? {
              ...l,
              resources: l.resources.map((r: any, k: number) =>
                k === resourceIndex ? { ...r, [name]: value } : r
              ),
            } : l
          ),
        } : m
      ),
    }));
  };
  
  const handleAssignmentChange = (path: { moduleIndex?: number, assignmentIndex: number }, name: string, value: string) => {
    setCourseContent((prev: any) => {
      if (path.moduleIndex !== undefined) {
        return { ...prev, modules: prev.modules.map((m: any, i: number) => i === path.moduleIndex ? { ...m, assignments: m.assignments.map((a: any, j: number) => j === path.assignmentIndex ? { ...a, [name]: value } : a), } : m ), };
      } else {
        return { ...prev, finalAssignments: prev.finalAssignments.map((a: any, i: number) => i === path.assignmentIndex ? { ...a, [name]: value } : a ), };
      }
    });
  };

  const handleQuizChange = (path: { moduleIndex?: number; lessonIndex?: number; quizIndex: number; questionIndex?: number; optionIndex?: number }, field: string, value: any) => {
    setCourseContent((prev: any) => {
      const updateQuizzes = (quizzes: any[]) => {
        return quizzes.map((quiz, qIndex) => {
          if (qIndex !== path.quizIndex) return quiz;
          if (path.questionIndex !== undefined && path.optionIndex !== undefined) {
            return { ...quiz, questions: quiz.questions.map((q: any, quesIndex: number) => quesIndex === path.questionIndex ? { ...q, options: q.options.map((opt: any, optIndex: number) => optIndex === path.optionIndex ? { ...opt, [field]: value } : opt ), } : q ), };
          } else if (path.questionIndex !== undefined) {
            return { ...quiz, questions: quiz.questions.map((q: any, quesIndex: number) => quesIndex === path.questionIndex ? { ...q, [field]: value } : q ), };
          } else {
            return { ...quiz, [field]: value };
          }
        });
      };
      if (path.moduleIndex !== undefined && path.lessonIndex !== undefined) {
        return { ...prev, modules: prev.modules.map((m: any, i: number) => i === path.moduleIndex ? { ...m, lessons: m.lessons.map((l: any, j: number) => j === path.lessonIndex ? { ...l, quizzes: updateQuizzes(l.quizzes) } : l ), } : m ), };
      } else if (path.moduleIndex !== undefined) {
        return { ...prev, modules: prev.modules.map((m: any, i: number) => i === path.moduleIndex ? { ...m, quizzes: updateQuizzes(m.quizzes) } : m ), };
      } else {
        return { ...prev, finalQuizzes: updateQuizzes(prev.finalQuizzes) };
      }
    });
  };

  const handleFileChange = (e: any, moduleIndex: number, lessonIndex: number, resourceIndex: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (reader.readyState === 2) {
          const fileData = reader.result;
          setCourseContent((prev: any) => ({ ...prev, modules: prev.modules.map((m: any, i: number) => i === moduleIndex ? { ...m, lessons: m.lessons.map((l: any, j: number) => j === lessonIndex ? { ...l, resources: l.resources.map((r: any, k: number) => k === resourceIndex ? { ...r, file: fileData } : r ), } : l ), } : m ), }));
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const addLesson = (moduleIndex: number) => {
    const newLesson = { title: "", videoUrl: "", resources: [], quizzes: [] };
    setCourseContent((prev: any) => ({ ...prev, modules: prev.modules.map((m: any, i: number) => i === moduleIndex ? { ...m, lessons: [...m.lessons, newLesson] } : m ) }));
  };

  const addModule = () => {
    const newModule = { title: "", lessons: [], assignments: [], quizzes: [] };
    setCourseContent((prev: any) => ({ ...prev, modules: [...prev.modules, newModule] }));
  };

  const addResource = (moduleIndex: number, lessonIndex: number) => {
    const newResource = { title: "", file: "" };
    setCourseContent((prev: any) => ({ ...prev, modules: prev.modules.map((m: any, i: number) => i === moduleIndex ? { ...m, lessons: m.lessons.map((l: any, j: number) => j === lessonIndex ? { ...l, resources: [...l.resources, newResource] } : l ) } : m ) }));
  };

  const addAssignment = (moduleIndex?: number) => {
    const newAssignment = { title: "", description: "" };
    setCourseContent((prev: any) => {
      if (moduleIndex !== undefined) {
        return { ...prev, modules: prev.modules.map((m: any, i: number) => i === moduleIndex ? { ...m, assignments: [...(m.assignments || []), newAssignment] } : m ) };
      } else {
        return { ...prev, finalAssignments: [...(prev.finalAssignments || []), newAssignment] };
      }
    });
  };

  const addQuiz = (moduleIndex?: number, lessonIndex?: number) => {
    const newQuiz = { quizId: Date.now().toString(), title: "New Quiz", questions: [] };
    setCourseContent((prev: any) => {
      if (moduleIndex !== undefined && lessonIndex !== undefined) {
        return { ...prev, modules: prev.modules.map((m: any, i: number) => i === moduleIndex ? { ...m, lessons: m.lessons.map((l: any, j: number) => j === lessonIndex ? { ...l, quizzes: [...(l.quizzes || []), newQuiz] } : l ) } : m ) };
      } else if (moduleIndex !== undefined) {
        return { ...prev, modules: prev.modules.map((m: any, i: number) => i === moduleIndex ? { ...m, quizzes: [...(m.quizzes || []), newQuiz] } : m ) };
      } else {
        return { ...prev, finalQuizzes: [...(prev.finalQuizzes || []), newQuiz] };
      }
    });
  };

  const addQuizQuestion = (quizPath: { moduleIndex?: number, lessonIndex?: number, quizIndex: number }) => {
    const newQuestion = { _id: Date.now().toString(), questionText: "", options: [{ _id: Date.now().toString() + '1', optionText: "" }, { _id: Date.now().toString() + '2', optionText: "" }], correctAnswer: "" };
    setCourseContent((prev: any) => {
        if (quizPath.moduleIndex !== undefined && quizPath.lessonIndex !== undefined) {
            return { ...prev, modules: prev.modules.map((m: any, i: number) => i === quizPath.moduleIndex ? { ...m, lessons: m.lessons.map((l: any, j: number) => j === quizPath.lessonIndex ? { ...l, quizzes: l.quizzes.map((q: any, k: number) => k === quizPath.quizIndex ? { ...q, questions: [...(q.questions || []), newQuestion] } : q) } : l) } : m) };
        } else if (quizPath.moduleIndex !== undefined) {
            return { ...prev, modules: prev.modules.map((m: any, i: number) => i === quizPath.moduleIndex ? { ...m, quizzes: m.quizzes.map((q: any, k: number) => k === quizPath.quizIndex ? { ...q, questions: [...(q.questions || []), newQuestion] } : q) } : m) };
        } else {
            return { ...prev, finalQuizzes: prev.finalQuizzes.map((q: any, k: number) => k === quizPath.quizIndex ? { ...q, questions: [...(q.questions || []), newQuestion] } : q) };
        }
    });
  };
  
  // MODIFICATION: Rewrote the addQuizOption function to handle all paths correctly
  const addQuizOption = (quizPath: { moduleIndex?: number, lessonIndex?: number, quizIndex: number, questionIndex: number }) => {
    const newOption = { _id: Date.now().toString(), optionText: "" };
    setCourseContent((prev: any) => {
        const updateFn = (quizzes: any[]) => quizzes.map((q, qIndex) => {
            if (qIndex !== quizPath.quizIndex) return q;
            return {
                ...q,
                questions: q.questions.map((ques: any, quesIndex: number) => quesIndex === quizPath.questionIndex ? {
                    ...ques,
                    options: [...(ques.options || []), newOption]
                } : ques)
            };
        });

        if (quizPath.moduleIndex !== undefined && quizPath.lessonIndex !== undefined) {
            return { ...prev, modules: prev.modules.map((m: any, i: number) => i === quizPath.moduleIndex ? { ...m, lessons: m.lessons.map((l: any, j: number) => j === quizPath.lessonIndex ? { ...l, quizzes: updateFn(l.quizzes) } : l ) } : m ) };
        } else if (quizPath.moduleIndex !== undefined) {
            return { ...prev, modules: prev.modules.map((m: any, i: number) => i === quizPath.moduleIndex ? { ...m, quizzes: updateFn(m.quizzes) } : m ) };
        } else {
            return { ...prev, finalQuizzes: updateFn(prev.finalQuizzes) };
        }
    });
  };

  const removeModule = (moduleIndex: number) => {
    setCourseContent((prev: any) => ({ ...prev, modules: prev.modules.filter((_: any, i: number) => i !== moduleIndex) }));
    toast.success("Module removed");
  };

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    setCourseContent((prev: any) => ({ ...prev, modules: prev.modules.map((m: any, i: number) => i === moduleIndex ? { ...m, lessons: m.lessons.filter((_: any, j: number) => j !== lessonIndex) } : m ) }));
    toast.success("Lesson removed");
  };

  const handleRemoveResource = (moduleIndex: number, lessonIndex: number, resourceIndex: number) => {
    setCourseContent((prev: any) => ({ ...prev, modules: prev.modules.map((m: any, i: number) => i === moduleIndex ? { ...m, lessons: m.lessons.map((l: any, j: number) => j === lessonIndex ? { ...l, resources: l.resources.filter((_: any, k: number) => k !== resourceIndex) } : l ) } : m ) }));
    toast.success("Resource removed");
  };

  const removeAssignment = (assignmentIndex: number, moduleIndex?: number) => {
    setCourseContent((prev: any) => {
      if (moduleIndex !== undefined) {
        return { ...prev, modules: prev.modules.map((m: any, i: number) => i === moduleIndex ? { ...m, assignments: m.assignments.filter((_: any, j: number) => j !== assignmentIndex) } : m ) };
      } else {
        return { ...prev, finalAssignments: prev.finalAssignments.filter((_: any, i: number) => i !== assignmentIndex) };
      }
    });
    toast.success("Assignment removed");
  };
  
  const removeQuiz = (quizIndex: number, moduleIndex?: number, lessonIndex?: number) => {
      setCourseContent((prev: any) => {
          if (moduleIndex !== undefined && lessonIndex !== undefined) {
              return { ...prev, modules: prev.modules.map((m: any, i: number) => i === moduleIndex ? { ...m, lessons: m.lessons.map((l: any, j: number) => j === lessonIndex ? { ...l, quizzes: l.quizzes.filter((_: any, qIndex: number) => qIndex !== quizIndex) } : l) } : m) };
          } else if (moduleIndex !== undefined) {
              return { ...prev, modules: prev.modules.map((m: any, i: number) => i === moduleIndex ? { ...m, quizzes: m.quizzes.filter((_: any, qIndex: number) => qIndex !== quizIndex) } : m) };
          } else {
              return { ...prev, finalQuizzes: prev.finalQuizzes.filter((_: any, qIndex: number) => qIndex !== quizIndex) };
          }
      });
      toast.success("Quiz removed");
  };

  const removeQuizQuestion = (path: { moduleIndex?: number, lessonIndex?: number, quizIndex: number, questionIndex: number }) => {
    setCourseContent((prev: any) => {
      const updateFn = (quizzes: any[]) => quizzes.map((q: any, qIndex: number) => qIndex === path.quizIndex ? { ...q, questions: q.questions.filter((_: any, quesIndex: number) => quesIndex !== path.questionIndex) } : q);
      if (path.moduleIndex !== undefined && path.lessonIndex !== undefined) {
        return { ...prev, modules: prev.modules.map((m: any, i: number) => i === path.moduleIndex ? { ...m, lessons: m.lessons.map((l: any, j: number) => j === path.lessonIndex ? { ...l, quizzes: updateFn(l.quizzes) } : l) } : m) };
      } else if (path.moduleIndex !== undefined) {
        return { ...prev, modules: prev.modules.map((m: any, i: number) => i === path.moduleIndex ? { ...m, quizzes: updateFn(m.quizzes) } : m) };
      } else {
        return { ...prev, finalQuizzes: updateFn(prev.finalQuizzes) };
      }
    });
  };
  
  const removeQuizOption = (path: { moduleIndex?: number, lessonIndex?: number, quizIndex: number, questionIndex: number, optionIndex: number }) => {
    setCourseContent((prev: any) => {
      const updateFn = (quizzes: any[]) => quizzes.map((q: any, qIndex: number) => qIndex === path.quizIndex ? {
        ...q,
        questions: q.questions.map((ques: any, quesIndex: number) => quesIndex === path.questionIndex ? {
          ...ques,
          options: ques.options.filter((_: any, optIndex: number) => optIndex !== path.optionIndex)
        } : ques)
      } : q);
      if (path.moduleIndex !== undefined && path.lessonIndex !== undefined) {
        return { ...prev, modules: prev.modules.map((m: any, i: number) => i === path.moduleIndex ? { ...m, lessons: m.lessons.map((l: any, j: number) => j === path.lessonIndex ? { ...l, quizzes: updateFn(l.quizzes) } : l) } : m) };
      } else if (path.moduleIndex !== undefined) {
        return { ...prev, modules: prev.modules.map((m: any, i: number) => i === path.moduleIndex ? { ...m, quizzes: updateFn(m.quizzes) } : m) };
      } else {
        return { ...prev, finalQuizzes: updateFn(prev.finalQuizzes) };
      }
    });
  };
  
  const prevButton = () => setActive(active - 1);
  const nextButton = () => { handleCourseSubmit(); setActive(active + 1); };

  if (!courseContent || !courseContent.modules) return null;

  return (
    <div className="w-[80%] m-auto mt-24 p-3">
      <h1 className={`${styles.title}`}>Course Content</h1>
      
      {courseContent.modules.map((module: any, moduleIndex: number) => (
        <div key={module._id || moduleIndex} className="w-full bg-[#cdc8c817] p-4 my-5 rounded-lg relative">
          <AiOutlineDelete className="absolute top-4 right-4 text-red-500 text-xl cursor-pointer" onClick={() => removeModule(moduleIndex)} />
          <input type="text" className="text-[20px] font-Poppins cursor-pointer dark:text-white text-black bg-transparent outline-none w-full" value={module.title} placeholder="Module Title..." onChange={(e) => handleModuleTitleChange(moduleIndex, e.target.value)} />

          {(module.lessons || []).map((lesson: any, lessonIndex: number) => (
            <div key={lesson._id || lessonIndex} className="w-full bg-[#4a4a4a17] p-3 my-4 rounded-md relative">
              <AiOutlineDelete className="absolute top-2 right-2 text-red-500 text-lg cursor-pointer z-10" onClick={() => removeLesson(moduleIndex, lessonIndex)} />
              <p className="font-bold text-gray-800 dark:text-gray-200">Lesson {lessonIndex + 1}</p>
              <input type="text" placeholder="Lesson Title..." className={`${styles.input} my-2`} value={lesson.title} onChange={(e) => handleLessonChange(moduleIndex, lessonIndex, 'title', e.target.value)} />
              <input type="text" placeholder="Video URL..." className={`${styles.input} my-2`} value={lesson.videoUrl} onChange={(e) => handleLessonChange(moduleIndex, lessonIndex, 'videoUrl', e.target.value)} />

              <h3 className="text-lg font-semibold mt-4 dark:text-white text-black">Resources</h3>
              {(lesson.resources || []).map((resource: any, resourceIndex: number) => (
                  <div key={resource._id || resourceIndex} className="my-2 p-2 border rounded-md relative">
                      <AiOutlineDelete className="absolute top-2 right-2 text-red-500 cursor-pointer text-lg" onClick={() => handleRemoveResource(moduleIndex, lessonIndex, resourceIndex)} />
                      <input type="text" placeholder="Resource Title..." className={`${styles.input} my-1`} value={resource.title} onChange={(e) => handleResourceChange(moduleIndex, lessonIndex, resourceIndex, 'title', e.target.value)}/>
                      <input type="file" className={`${styles.input} my-1`} onChange={(e) => handleFileChange(e, moduleIndex, lessonIndex, resourceIndex)} />
                  </div>
                ))}
              <button type="button" onClick={() => addResource(moduleIndex, lessonIndex)} className="text-blue-500 mt-2 hover:text-blue-700">+ Add Resource</button>
            
              <div className="mt-4">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">Lesson Quizzes</h4>
                  <QuizEditor quizzes={lesson.quizzes} path={{ moduleIndex, lessonIndex }} handleQuizChange={handleQuizChange} removeQuiz={removeQuiz} addQuizQuestion={addQuizQuestion} removeQuizQuestion={removeQuizQuestion} addQuizOption={addQuizOption} removeQuizOption={removeQuizOption} />
                  <button type="button" onClick={() => addQuiz(moduleIndex, lessonIndex)} className="text-indigo-600 dark:text-indigo-400 mt-2 hover:text-indigo-800">
                    <AiOutlinePlusCircle className="inline-block mr-2" /> Add Lesson Quiz
                  </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => addLesson(moduleIndex)} className="text-green-500 mt-2 font-semibold hover:text-green-700">
            <AiOutlinePlusCircle className="inline-block mr-2" /> Add Lesson to Module
          </button>
          
          <div className="mt-4 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-md">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">Module Assignments</h4>
               {(module.assignments || []).map((assignment: any, assignmentIndex: number) => (
                    <div key={assignment.assignmentId || assignmentIndex} className="relative p-2 border my-2 rounded">
                        <AiOutlineDelete className="absolute top-2 right-2 text-red-500 cursor-pointer" onClick={() => removeAssignment(assignmentIndex, moduleIndex)}/>
                        <input type="text" placeholder="Assignment Title..." className={`${styles.input} my-2`} value={assignment.title} onChange={(e) => handleAssignmentChange({ moduleIndex, assignmentIndex }, 'title', e.target.value)} />
                        <textarea placeholder="Assignment Description..." className={`${styles.input} my-2 !h-24`} value={assignment.description} onChange={(e) => handleAssignmentChange({ moduleIndex, assignmentIndex }, 'description', e.target.value)} />
                    </div>
                ))}
                <button type="button" onClick={() => addAssignment(moduleIndex)} className="text-purple-600 dark:text-purple-400 mt-2 hover:text-purple-800">
                    <AiOutlinePlusCircle className="inline-block mr-2" /> Add Module Assignment
                </button>
          </div>

          <div className="mt-4 p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-md">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">Module Quizzes</h4>
              <QuizEditor quizzes={module.quizzes} path={{ moduleIndex }} handleQuizChange={handleQuizChange} removeQuiz={removeQuiz} addQuizQuestion={addQuizQuestion} removeQuizQuestion={removeQuizQuestion} addQuizOption={addQuizOption} removeQuizOption={removeQuizOption} />
              <button type="button" onClick={() => addQuiz(moduleIndex)} className="text-indigo-600 dark:text-indigo-400 mt-2 hover:text-indigo-800">
                    <AiOutlinePlusCircle className="inline-block mr-2" /> Add Module Quiz
              </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addModule} className="text-xl text-green-600 mt-4 font-bold hover:text-green-800 flex items-center">
        <AiOutlinePlusCircle className="mr-2"/> Add Module
      </button>

      <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/30 rounded-lg">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Final Course Assignments</h2>
          {(courseContent.finalAssignments || []).map((assignment: any, assignmentIndex: number) => (
            <div key={assignment.assignmentId || assignmentIndex} className="relative p-2 border my-2 rounded">
                <AiOutlineDelete className="absolute top-2 right-2 text-red-500 cursor-pointer" onClick={() => removeAssignment(assignmentIndex)}/>
                <input type="text" placeholder="Final Assignment Title..." className={`${styles.input} my-2`} value={assignment.title} onChange={(e) => handleAssignmentChange({ assignmentIndex }, 'title', e.target.value)} />
                <textarea placeholder="Final Assignment Description..." className={`${styles.input} my-2 !h-24`} value={assignment.description} onChange={(e) => handleAssignmentChange({ assignmentIndex }, 'description', e.target.value)} />
            </div>
          ))}
          <button type="button" onClick={() => addAssignment()} className="text-red-600 dark:text-red-400 mt-2 hover:text-red-800">
             <AiOutlinePlusCircle className="inline-block mr-2" /> Add Final Assignment
          </button>
      </div>

      <div className="mt-6 p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Final Course Quizzes</h2>
          <QuizEditor quizzes={courseContent.finalQuizzes} path={{}} handleQuizChange={handleQuizChange} removeQuiz={removeQuiz} addQuizQuestion={addQuizQuestion} removeQuizQuestion={removeQuizQuestion} addQuizOption={addQuizOption} removeQuizOption={removeQuizOption} />
          <button type="button" onClick={() => addQuiz()} className="text-indigo-600 dark:text-indigo-400 mt-2 hover:text-indigo-800">
             <AiOutlinePlusCircle className="inline-block mr-2" /> Add Final Quiz
          </button>
      </div>

      <div className="w-full flex items-center justify-between mt-8">
        <button type="button" onClick={prevButton} className="w-full 800px:w-[180px] h-[40px] bg-gray-500 text-center text-[#fff] rounded cursor-pointer">
          Prev
        </button>
        <button type="button" onClick={nextButton} className="w-full 800px:w-[180px] h-[40px] bg-[#37a39a] text-center text-[#fff] rounded cursor-pointer">
          Next
        </button>
      </div>
    </div>
  );
};

export default CourseData;