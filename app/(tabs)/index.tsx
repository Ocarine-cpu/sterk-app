import { ScrollView, Text, View } from 'react-native';

import { posts } from '../../src/data/posts';

import DaySummaryCard from '../../src/components/DaySummaryCard';
import Header from '../../src/components/Header';
import PostCard from '../../src/components/PostCard';
import StartWorkoutButton from '../../src/components/StartWorkoutButton';

import { COLORS, FONT, SPACING } from '../../src/styles/theme';

export default function Home() {

  const today = new Date();

  const formattedDate = today.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <ScrollView style={{ backgroundColor: COLORS.background }}>

      <Header 
        name="Davi"
        subtitle={formattedDate}
      />

      <DaySummaryCard />

      <StartWorkoutButton />

      <View style={{ marginTop: SPACING.xl }}>
        <Text style={{
          marginLeft: SPACING.lg,
          marginBottom: SPACING.sm,
          fontWeight: "700",
          fontSize: FONT.lg,
          color: COLORS.text
        }}>
          Feed do Grupo
        </Text>
        
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </View>

    </ScrollView>
  );
}