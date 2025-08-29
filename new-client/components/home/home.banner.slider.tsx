import { View, Image, ActivityIndicator, StyleSheet, Dimensions } from "react-native";
import Swiper from "react-native-swiper";
import { useEffect, useState } from "react";
import axios from "axios";
import { SERVER_URI } from "@/utils/uri";
import {heightPercentageToDP as hp} from "react-native-responsive-screen";
//import axiosInstance from "@/utils/axios.instance";

type BannerImageType = {
    _id: string;
    url: string;
    width: number;
    height: number;
}

const screenWidth = Dimensions.get('window').width;

export default function HomeBannerSlider() {
  const [bannerImages, setBannerImages] = useState<BannerImageType[]>([]);
  const [loading, setLoading] = useState(true);
   const [sliderHeight, setSliderHeight] = useState(200);

  useEffect(() => {
    // THE FIX: Fetch images from the new /get-banners endpoint
    axios.get(`${SERVER_URI}/get-banners`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
    })
      .then(res => {
        if (res.data && res.data.bannerImages) {
          const images: BannerImageType[] = res.data.bannerImages;
          setBannerImages(images);
          if (images.length > 0) {
            const firstImage = images[0];
            const imageAspectRatio = firstImage.height / firstImage.width;
            setSliderHeight((screenWidth - 32) * imageAspectRatio); // -32 for horizontal margin
          }
        }
      })
      .catch(error => {
        console.error("Failed to fetch banner images:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const onIndexChanged = (index: number) => {
      if (bannerImages[index]) {
          const currentImage = bannerImages[index];
          const imageAspectRatio = currentImage.height / currentImage.width;
          setSliderHeight((screenWidth - 32) * imageAspectRatio);
      }
  };

  if (loading) {
      return (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color="#2467EC"/>
          </View>
      );
  }
  
  if (bannerImages.length === 0) {
      return null;
  }

  return (
    <View style={[styles.container, { height: sliderHeight }]}>
      <Swiper
        dotStyle={styles.dot}
        activeDotStyle={styles.activeDot}
        autoplay={true}
        autoplayTimeout={5}
        onIndexChanged={onIndexChanged}
        loop={true}
      >
        {bannerImages.map((item) => (
          <View key={item._id} style={styles.slide}>
            <Image
              source={{ uri: item.url }}
              style={styles.image}
            />
          </View>
        ))}
      </Swiper>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 12,
        height: hp("25%"),
        marginHorizontal: 16,
    },
    slide: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    dot: {
        backgroundColor: "#C6C7CC",
        width: 10,
        height: 10,
        borderRadius: 5,
        marginHorizontal: 3,
    },
    activeDot: {
        backgroundColor: "#2467EC",
        width: 10,
        height: 10,
        borderRadius: 5,
        marginHorizontal: 3,
    },
});