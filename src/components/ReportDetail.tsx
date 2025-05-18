
import { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, MapPin, Car, Check, Clock, Wallet, CheckCircle2 } from "lucide-react";
import { VoteButtons } from "./VoteButtons";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export const ReportDetail = ({ reportId, onClose }: { reportId: string; onClose: () => void }) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);
  const { user } = useAuth();

  // Add new state for showing reward popup
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [isUserSubscribed, setIsUserSubscribed] = useState(false);
  const [challanAmount, setChallanAmount] = useState<number>(0);
  const [imageError, setImageError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      if (!reportId) return;

      try {
        const { data, error } = await supabase
          .from("reports")
          .select(`
            *,
            profiles:user_id (username)
          `)
          .eq("id", reportId)
          .single();

        if (error) throw error;
        
        console.log("Report data:", data);
        setReport(data);
        setChallanAmount(data.challan_amount || 0);

        // Show reward popup if report status is verified
        if (data.status === 'verified') {
          setShowRewardPopup(true);
        }

        // Check user votes
        if (user) {
          const { data: voteData } = await supabase
            .from("report_votes")
            .select("vote_type")
            .eq("report_id", reportId)
            .eq("user_id", user.id)
            .maybeSingle();

          setUserVote(voteData?.vote_type as 'upvote' | 'downvote' | null);
        }
        
        // Check if user is subscribed
        if (user) {
          const { data: userData } = await supabase
            .from("profiles")
            .select("is_subscribed")
            .eq("id", user.id)
            .single();
            
          setIsUserSubscribed(userData?.is_subscribed || false);
        }
        
        setLoading(false);
      } catch (error: any) {
        console.error("Error loading report:", error);
        setError("Failed to load report details");
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId, user]);

  const handleCloseDialog = () => {
    setDialogOpen(false);
    onClose();
  };

  const getStatusBadge = () => {
    switch (report?.status) {
      case "verified":
        return <Badge className="bg-green-500">Verified</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "verified_by_community":
        return <Badge className="bg-blue-500">Community Verified</Badge>;
      case "invalid_plate":
        return <Badge variant="destructive">Invalid Plate</Badge>;
      default:
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Pending</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const handleVoteChange = (newVote: 'upvote' | 'downvote' | null) => {
    setUserVote(newVote);
  };

  const handleImageError = () => {
    console.log("Image failed to load");
    setImageError(true);
    toast.error("Failed to load image. The image might be unavailable.");
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-6 text-center text-red-500">
          <AlertCircle className="h-10 w-10 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      );
    }

    if (!report) return null;

    return (
      <>
        <DialogHeader>
          <DialogTitle>Report Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {report.image_url && !imageError ? (
              <img
                src={report.image_url}
                alt="Violation evidence"
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  {imageError ? "Image could not be loaded" : "No image available"}
                </p>
              </div>
            )}
            <div className="absolute top-2 right-2">
              {getStatusBadge()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Violation Type</p>
              <p className="font-medium">{report.violation_type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date Reported</p>
              <p className="font-medium">{formatDate(report.created_at)}</p>
            </div>
          </div>

          {report.number_plate && (
            <div className="border rounded-lg p-3">
              <div className="flex items-center">
                <Car className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="font-medium">Vehicle Details</span>
              </div>
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">Number Plate</p>
                <p className="font-mono text-lg">{report.number_plate}</p>
              </div>
            </div>
          )}

          {report.location && (
            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 mr-2" />
              <p>{report.location}</p>
            </div>
          )}

          {report.description && (
            <div>
              <p className="text-sm text-muted-foreground">Additional Details</p>
              <p className="mt-1">{report.description}</p>
            </div>
          )}

          {/* AI Detection Results */}
          {report.ml_detected && report.ml_violations && (
            <div className="border rounded-lg p-3 bg-muted/20">
              <p className="text-sm font-medium">AI Detection Results</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Array.isArray(report.ml_violations) ? report.ml_violations : [report.ml_violations]).map((violation: string, idx: number) => (
                  <Badge key={idx} variant="outline">{violation}</Badge>
                ))}
              </div>
              {report.ml_confidence && (
                <p className="text-xs text-muted-foreground mt-1">
                  Detection confidence: {Math.round(report.ml_confidence * 100)}%
                </p>
              )}
            </div>
          )}
          
          {/* Challan Amount */}
          <div className="border rounded-lg p-3 bg-green-50 border-green-100">
            <div className="flex items-center">
              <Wallet className="h-5 w-5 mr-2 text-green-600" />
              <span className="font-medium">Challan Details</span>
            </div>
            <div className="mt-2">
              <p className="text-sm text-green-700">Challan Amount</p>
              <p className="font-medium text-lg">₹{report.challan_amount || "N/A"}</p>
              {isUserSubscribed && report.status === 'verified' && (
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  You'll earn ₹{((report.challan_amount || 0) * 0.1).toFixed(2)} when the challan is paid
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 border-t">
            <VoteButtons
              reportId={report.id}
              initialUpvotes={0}
              initialDownvotes={0}
              userVote={userVote}
              onVoteChange={handleVoteChange}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={handleCloseDialog}>
            Close
          </Button>
        </DialogFooter>
      </>
    );
  };

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) onClose();
      }}>
        <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
          {renderContent()}
        </DialogContent>
      </Dialog>
      
      {/* Reward Popup */}
      {showRewardPopup && report?.status === 'verified' && (
        <Dialog open={showRewardPopup} onOpenChange={setShowRewardPopup}>
          <DialogContent className="max-w-md">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-center mb-2">Report Verified!</h2>
            <p className="text-center text-muted-foreground mb-4">
              Your report has been verified. You will receive your reward once the violator pays the challan.
            </p>
            {isUserSubscribed ? (
              <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-4">
                <p className="text-sm text-center text-green-700">
                  As a subscriber, you'll earn ₹{((report.challan_amount || 0) * 0.1).toFixed(2)} when the challan is paid
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                <p className="text-sm text-center text-blue-700">
                  Subscribe to earn rewards on your verified reports
                </p>
                <div className="flex justify-center mt-2">
                  <Button asChild size="sm" variant="outline" className="bg-white">
                    <Link to="/app/subscription">Subscribe Now</Link>
                  </Button>
                </div>
              </div>
            )}
            <Button className="w-full" onClick={() => setShowRewardPopup(false)}>
              Got it
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
