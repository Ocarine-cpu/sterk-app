import { Post } from "../types/Post";

export const posts: Post[] = [
    {
        id: 1,
        user: "Davi",
        avatar: "DR",
        activity: "Kickboxing",
        duration: "60 min",
        calories: 320,
        timestamp: "há 1 hora",
        likes: 6,
        comments: 2,
        caption: "Adorei o modelito, foi maridinho que comprou pra você?",
    },
    {
        id: 2,
        user: "Richard",
        avatar: "RD",
        activity: "Academia",
        duration: "95 min",
        calories: 120,
        timestamp: "há 3 horas",
        likes: 8,
        comments: 3,
        caption: "Só cresce quem aplica",
    },
    {
        id: 3,
        user: "Vitor",
        avatar: "VT",
        activity: "Corrida",
        duration: "45 min",
        calories: 120,
        timestamp: "há 5 horas",
        likes: 4,
        comments: 3,
        caption: "Ando devagar, pois já tive pressa",
    }
]