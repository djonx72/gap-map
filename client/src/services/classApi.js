/**
 * classApi.js — talks to the GapMap backend API for class-related endpoints.
 */

/**
 * createClass — POSTs to /classes
 * 
 * @param {Object} params
 * @param {string} params.accessToken
 * @param {string} params.name
 * @param {string} params.subject
 */
export async function createClass({ accessToken, name, subject }) {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/classes`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ name, subject }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error ?? 'An unexpected error occurred while creating the class.')
  }

  return data.class
}

/**
 * getTeacherClasses — GETs to /classes
 * 
 * @param {Object} params
 * @param {string} params.accessToken
 */
export async function getTeacherClasses({ accessToken }) {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/classes`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error ?? 'An unexpected error occurred while fetching classes.')
  }

  return data.classes
}

/**
 * getClassById — GETs to /classes/:id
 * 
 * @param {Object} params
 * @param {string} params.accessToken
 * @param {string} params.classId
 */
export async function getClassById({ accessToken, classId }) {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/classes/${classId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error ?? 'An unexpected error occurred while fetching the class.')
  }

  return data.class
}
