import OpenAI from 'openai'
import UserData from '../models/UserData.js'

const ai = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
})

const NO_INFO_REPLY = "Sorry, I don't have information about that."

const getSiteStats = async () => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
 
    const [totalUsers, usersToday, usersThisMonth] = await Promise.all([
        UserData.countDocuments(),
        UserData.countDocuments({createdAt:{$gte:startOfToday}}),
        UserData.countDocuments({createdAt:{$gte:startOfMonth}})
    ])
 
    return `- Total registered users: ${totalUsers}
- Users registered today: ${usersToday}
- Users registered this month: ${usersThisMonth}`
}

const buildSystemPrompt = (stats) => {
    return `You are a helpful assistant for our website.
Answer the user's question using ONLY the data given below.
Do not use your own general knowledge, even if you know the answer.
If the answer is not in the data, reply exactly: "${NO_INFO_REPLY}"
You may reply politely to greetings like "hi" or "thanks".
Keep answers short and clear.
 
LIVE WEBSITE STATS:
${stats}`
}


export const chatWithAI = async (req,res) => {
    try {
        const messages = req.body.messages
        if(!Array.isArray(messages)) {
            return res.status(400).json({errorMessage:"messages must be an array"})
        }
 
        // accept only user/assistant messages so the client cannot send its own system prompt
        const history = messages
            .filter((m) => ['user','assistant'].includes(m.role) && typeof m.content === 'string')
            .slice(-10)
 
        const stats = await getSiteStats()
 
        // Step 3: send the question + database data to the AI
        const completion = await ai.chat.completions.create({
            model: process.env.AI_MODEL,
            messages: [{role:'system',content:buildSystemPrompt(stats)}, ...history],
            temperature: 0.2
        })
 
        res.status(200).json({message:"reply generated successfully",reply:completion.choices[0].message.content})
    } catch(error) {
        console.log("AI error:",error.status,error.message)
        const busy = error.status === 429 || error.status === 503
        res.status(error.status || 500).json({
            errorMessage: busy ? "AI is busy right now, please try again in a minute" : "Failed to get a reply from AI"
        })
    }
}

