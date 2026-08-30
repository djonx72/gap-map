export async function getQuizQuestions({ accessToken, classId }) {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/questions/${classId}/quiz`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error ?? 'An unexpected error occurred while fetching quiz questions.')
  }

  return data.questions
}

export async function submitQuiz({ accessToken, answers }) {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/submissions/quiz`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ answers }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error ?? 'An unexpected error occurred while submitting the quiz.')
  }

  return data
}

export async function getSubmissionStatus({ accessToken, classId }) {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/submissions/status/${classId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error ?? 'An unexpected error occurred while checking quiz status.')
  }

  return data
}
