// C:\Lms-App - Copy\client\components\courses\course.lesson.tsx

import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React, { useState } from "react";
import { Entypo, Feather } from "@expo/vector-icons";
import { Nunito_400Regular, Nunito_500Medium } from "@expo-google-fonts/nunito";
import { Raleway_600SemiBold, Raleway_700Bold } from "@expo-google-fonts/raleway";
import { useFonts } from "expo-font";

// The component now accepts a 'modules' array directly
type Props = {
  modules: ModuleType[];
};

export default function CourseLesson({ modules }: Props) {
  const [visibleModules, setVisibleModules] = useState<Set<string>>(new Set<string>());
  
  let [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Raleway_600SemiBold,
    Raleway_700Bold, // Added Raleway_700Bold for module titles
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const toggleModule = (moduleKey: string) => {
    const newVisibleModules = new Set(visibleModules);
    if (newVisibleModules.has(moduleKey)) {
      newVisibleModules.delete(moduleKey);
    } else {
      newVisibleModules.add(moduleKey);
    }
    setVisibleModules(newVisibleModules);
  };

  return (
    <View style={{ flex: 1, rowGap: 10, marginBottom: 10 }}>
      <View style={styles.mainContainer}>
        {/* MODIFICATION: Mapping over modules directly */}
        {modules.map((module: ModuleType, moduleIndex: number) => {
          const moduleKey = module._id || `${moduleIndex}`; // Use a unique key
          const isModuleVisible = visibleModules.has(moduleKey);

          return (
            <View key={moduleKey} style={{marginBottom: 15}}>
              {/* This is now the accordion header for the entire module */}
              <TouchableOpacity
                style={styles.moduleHeader}
                onPress={() => toggleModule(moduleKey)}
              >
                <Text style={styles.moduleTitle}>{module.title}</Text>
                {isModuleVisible ? (
                  <Entypo name="chevron-up" size={23} color={"#6707FE"} />
                ) : (
                  <Entypo name="chevron-down" size={23} color={"#6707FE"} />
                )}
              </TouchableOpacity>

              {/* MODIFICATION: Show lessons only when the module is visible */}
              {isModuleVisible && (
                <View style={{ marginLeft: 10 }}>
                  {module.lessons.map((lesson: LessonType, lessonIndex: number) => (
                    <View key={lessonIndex} style={styles.itemContainer}>
                      <View style={styles.itemContainerWrapper}>
                        <View style={styles.itemTitleWrapper}>
                          <Feather name="video" size={20} color={"#8a8a8a"} />
                          <Text style={styles.itemTitleText}>{lesson.title}</Text>
                        </View>
                        <View style={styles.itemDataContainer}>
                          <Text style={styles.itemLengthText}>
                            {/* {lesson.videoLength} min */}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#E1E2E5",
    borderRadius: 8,
  },
  // MODIFICATION: Renamed from sectionHeader to moduleHeader
  moduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomColor: "#DCDCDC",
    borderBottomWidth: 1,
  },
  // MODIFICATION: Renamed from sectionTitle to moduleTitle
  moduleTitle: {
    fontSize: 20,
    fontFamily: "Raleway_700Bold",
    flex: 1, // Allow title to take up space
  },
  itemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#E1E2E5",
    paddingVertical: 12,
  },
  itemContainerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemTitleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemTitleText: {
    marginLeft: 8,
    color: "#525258",
    fontSize: 16,
    fontFamily: "Nunito_500Medium",
    flexShrink: 1,
  },
  itemDataContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemLengthText: {
    marginRight: 6,
    color: "#818181",
    fontFamily: "Nunito_400Regular",
  },
});