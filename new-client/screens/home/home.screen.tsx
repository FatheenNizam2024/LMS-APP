// C:\Lms-App - Copy\client\screens\home\home.screen.tsx

import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Header from "@/components/header/header";
// import SearchInput from "@/components/common/search.input";
import HomeBannerSlider from "@/components/home/home.banner.slider";
import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import axiosInstance from "@/utils/axios.instance";
import { SERVER_URI } from "@/utils/uri";
import Loader from "@/components/loader/loader";
import CourseCard from "@/components/cards/course.card";
import { router, useFocusEffect  } from "expo-router";
// CORRECTED FONT IMPORTS
import { useFonts as useRalewayFonts, Raleway_700Bold } from "@expo-google-fonts/raleway";
import { useFonts as useNunitoFonts, Nunito_600SemiBold } from "@expo-google-fonts/nunito";
import useUser from "@/hooks/auth/useUser";
import Categories from "@/components/home/Categories";
// This component will contain all non-list items.
// const ListHeader = () => (
//     <>
//       <Header />
//       <SearchInput homeScreen={true} />
//       <HomeBannerSlider />
//     </>
// );


export default function HomeScreen() {
  const [courses, setCourses] = useState<CoursesType[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [searchValue, setSearchValue] = useState("");

  // CORRECTED FONT LOADING

  const { user, loading: userLoading, refetch: refetchUser } = useUser();
  // THE FIX: New state to hold the final, displayable avatar URL.
  const [displayAvatarUrl, setDisplayAvatarUrl] = useState<string | null>(null);

  const [ralewayLoaded] = useRalewayFonts({ Raleway_700Bold });
  const [nunitoLoaded] = useNunitoFonts({ Nunito_600SemiBold });

  const fontsLoaded = ralewayLoaded && nunitoLoaded;
  //const fontError = ralewayError || nunitoError;

  useFocusEffect(
    useCallback(() => {
      refetchUser();
    }, [])
  );

  useEffect(() => {
    const getAvatarUrl = async () => {
      if (!user) {
        setDisplayAvatarUrl(null);
        return;
      }
      if (user.avatar?.public_id && user.avatar.url === 'minio') {
        try {
          const res = await axiosInstance.get(`/get-avatar-url`, {
            params: { objectName: user.avatar.public_id }
          });
          setDisplayAvatarUrl(res.data.url);
        } catch (e) {
          console.log("Could not fetch MinIO avatar URL for Header, using fallback.");
          setDisplayAvatarUrl(null); // Fallback will be handled in Header
        }
      } else if (user.avatar?.url) {
        // Handle non-MinIO URLs (like Cloudinary)
        setDisplayAvatarUrl(user.avatar.url);
      } else {
        setDisplayAvatarUrl(null); // No avatar, use fallback
      }
    };
    getAvatarUrl();
  }, [user]); // This effect runs whenever the user object changes.


  useEffect(() => {
    axios
      .get(`${SERVER_URI}/get-courses`)
      .then((res: any) => {
        setCourses(res.data.courses || []); // Ensure courses is always an array
      })
      .catch((error) => {
        console.log(error);
        setCourses([]); // Set to empty array on error
      })
      .finally(() => {
        setLoadingCourses(false);
      });
  }, []);
  
  // Memoize the filtered courses to avoid re-calculating on every render
  const filteredCourses = useMemo(() => {
      if (!searchValue) {
          return courses; // Show all courses if search is empty
      }
      return courses.filter((course) => 
          course.name.toLowerCase().includes(searchValue.toLowerCase())
      );
  }, [searchValue, courses]);

  if (userLoading || loadingCourses || !fontsLoaded) {
    return <Loader />;
  }
  
  return (
    <LinearGradient
      colors={["#E5ECF9", "#F6F7F9"]}
      style={styles.container}
    >
        <Header user={user} avatarUrl={displayAvatarUrl} />
        {/* <SearchInput homeScreen={true} value={searchValue} setValue={setSearchValue} /> */}
      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item._id.toString()}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
        <HomeBannerSlider />
        <TouchableOpacity 
                    onPress={() => router.push("/(tabs)/courses")}
                    style={styles.seeAllButton}
                >
                    <Text style={styles.seeAllText}>See All Courses</Text>
                </TouchableOpacity>
        <Categories />
        </>
      }
        // ListFooterComponent={
        //     filteredCourses.length > 0 ? (
        //         <TouchableOpacity 
        //             onPress={() => router.push("/(tabs)/courses")}
        //             style={styles.seeAllButton}
        //         >
        //             <Text style={styles.seeAllText}>See All Courses</Text>
        //         </TouchableOpacity>
        //     ) : null
        // }
        ListEmptyComponent={
            <View style={{alignItems: 'center', marginTop: 50}}>
                <Text>No courses found.</Text>
            </View>
        }
        renderItem={({ item }) => <CourseCard item={item} />}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
     
    flex: 1,
    paddingTop: 50,
  },
  seeAllButton: {
    marginHorizontal: 16,
    marginVertical: 20,
    padding: 14,
    backgroundColor: '#2467EC',
    borderRadius: 8,
    alignItems: 'center',
  },
  seeAllText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold'
  }
});