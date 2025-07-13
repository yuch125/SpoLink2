// // screens/MyPostsApplicationsScreen.tsx

// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
// } from 'react-native';
// import axios from 'axios';
// import { useRoute } from '@react-navigation/native';
// import { SERVER_URL } from '../constants';

// export default function MyPostsApplicationsScreen({ route, navigation }) {
//   const { userId } = route.params;
//   const [posts, setPosts] = useState([]);

//   useEffect(() => {
//     const fetchPosts = async () => {
//       try {
//         const res = await axios.get(`${SERVER_URL}/posts`);
//         const myPosts = res.data.filter(
//           (p: any) => p.writer && (p.writer._id === userId || p.writer.userId === userId)
//         );
//         setPosts(myPosts);
//       } catch (err) {
//         console.error(err);
//         Alert.alert('모집글 불러오기 실패');
//       }
//     };

//     fetchPosts();
//   }, []);

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>내 모집글 신청자 보기</Text>
//       <FlatList
//         data={posts}
//         keyExtractor={(item) => item._id}
//         renderItem={({ item }) => (
//           <TouchableOpacity
//             style={styles.card}
//             onPress={() => navigation.navigate('Applications', { postId: item._id })}
//           >
//             <Text style={styles.content}>{item.content}</Text>
//             <Text style={styles.time}>{item.time}</Text>
//           </TouchableOpacity>
//         )}
//         ListEmptyComponent={<Text style={styles.empty}>작성한 모집글이 없습니다.</Text>}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#fff', padding: 16 },
//   title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
//   card: {
//     padding: 12,
//     borderRadius: 8,
//     backgroundColor: '#f0f0f0',
//     marginBottom: 10,
//   },
//   content: { fontSize: 16, fontWeight: 'bold' },
//   time: { fontSize: 14, color: '#555' },
//   empty: { textAlign: 'center', marginTop: 50, color: '#999' },
// });
