"use client";
import { styles } from "@/app/styles/style";
import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { AiOutlineDelete, AiOutlinePlusCircle } from "react-icons/ai";
import axios from 'axios';
import Cookies from 'js-cookie';
import Loader from "../../Loader/Loader";

const serverUri = process.env.NEXT_PUBLIC_SERVER_URI || "";
const accessToken = Cookies.get("accessToken");

interface BannerImage {
  _id: string;
  url: string;
}

const BannerManager = () => {
  const [images, setImages] = useState<BannerImage[]>([]);
  const [newImage, setNewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${serverUri}/get-banners`);
      setImages(response.data.bannerImages);
    } catch (error) {
      toast.error("Failed to fetch banners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.readyState === 2) {
          setNewImage(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!newImage) return;
    const toastId = toast.loading("Uploading image...");
    try {
      await axios.post(
        `${serverUri}/upload-banner`,
        { image: newImage },
        { headers: { 'access-token': accessToken } }
      );
      toast.success("Image uploaded successfully!", { id: toastId });
      setNewImage(null);
      fetchBanners(); // Refresh the list
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Upload failed.", { id: toastId });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner image?")) return;
    const toastId = toast.loading("Deleting image...");
    try {
      await axios.delete(
        `${serverUri}/delete-banner/${id}`,
        { headers: { 'access-token': accessToken } }
      );
      toast.success("Image deleted successfully!", { id: toastId });
      fetchBanners(); // Refresh the list
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Deletion failed.", { id: toastId });
    }
  };

  return (
    <div className="w-[90%] m-auto mt-24 p-4">
      <h1 className={`${styles.title}`}>Manage Banner Images</h1>
      
      {/* Upload Section */}
      <div className="my-8 p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Upload New Banner</h2>
        <input 
            type="file" 
            accept="image/*"
            className={`${styles.input} !h-auto p-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100`}
            onChange={handleFileChange}
        />
        {newImage && (
            <div className="my-4 flex items-center gap-4">
                <img src={newImage} alt="Preview" className="w-48 h-24 object-cover rounded-lg"/>
                <button className={`${styles.button} !w-32`} onClick={handleUpload}>Confirm Upload</button>
            </div>
        )}
      </div>

      {/* Display Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Current Banners</h2>
        {loading ? <Loader /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map(img => (
                    <div key={img._id} className="relative group">
                        <img src={img.url} alt="Banner" className="w-full h-40 object-cover rounded-lg shadow-lg"/>
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleDelete(img._id)} className="p-3 bg-red-600 rounded-full text-white">
                                <AiOutlineDelete size={24} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default BannerManager;