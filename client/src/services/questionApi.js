/**
 * questionApi.js — talks to the GapMap backend API for question-related endpoints.
 */

/**
 * createQuestion — POSTs to /questions
 * 
 * @param {Object} params
 * @param {string} params.accessToken
 * @param {string} params.class_id
 * @param {string} params.topic
 * @param {string} params.type
 * @param {string} params.difficulty
 * @param {string} params.content
 * @param {string} params.correct_answer
 * @param {Object} [params.options] - Required for mcq
 */
export async function createQuestion({ accessToken, class_id, topic, type, difficulty, content, correct_answer, options }) {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/questions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ class_id, topic, type, difficulty, content, correct_answer, options }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error ?? 'An unexpected error occurred while creating the question.')
  }

  return data.question
}

/**
 * getClassQuestions — GETs to /questions/:classId
 * 
 * @param {Object} params
 * @param {string} params.accessToken
 * @param {string} params.classId
 */
export async function getClassQuestions({ accessToken, classId }) {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/questions/${classId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error ?? 'An unexpected error occurred while fetching questions.')
  }

  return data.questions
}
