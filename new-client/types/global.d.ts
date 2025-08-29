
type onboardingSwiperDataType = {
  id: number;
  title: string;
  description: string;
  sortDescrition: string;
  sortDescrition2?: string;
  image: any;
};

type Avatar = {
  public_id: string;
  url: string;
};

type User = {
  _id: string;
  name: string;
  email: string;
  username: string; // Added username
  avatar?: Avatar;
  password?: string;
  // Courses is an array of objects containing the course ID and name
  courses: { 
      _id: string;
      name: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
};

type BannerDataTypes = {
  bannerImageUrl: any;
};

