import { BentoGrid, BentoItem } from "@/components/bento-grid";
import { IonContent, IonPage } from "@ionic/react";
import { BarChart3, Users, Calendar, MessageSquare, CreditCard, Settings } from "lucide-react";

const Page: React.FC = () => {
    return (
        <IonPage>
            <IonContent>
                <BentoGrid>
                    {/* Featured item - spans 2 columns */}
                    <BentoItem
                        colSpan={2}
                        title="Monthly Analytics"
                        description="View your performance metrics for the past month"
                        icon={<BarChart3 className="h-6 w-6 text-primary" />}
                    >
                        <div className="h-40 bg-zinc-200 bg-muted/50 rounded-lg mt-4 flex items-center justify-center">
                            Chart visualization goes here
                        </div>
                    </BentoItem>

                    {/* Regular items */}
                    <BentoItem
                        title="Team Members"
                        description="Manage your team"
                        icon={<Users className="h-6 w-6 text-blue-500" />}
                    />

                    <BentoItem
                        title="Calendar"
                        description="Schedule and manage events"
                        icon={<Calendar className="h-6 w-6 text-green-500" />}
                    >
                        <div className="h-24 bg-muted/50 rounded-lg mt-4 flex items-center justify-center">Calendar preview</div>
                    </BentoItem>

                    {/* Item that spans 2 rows */}
                    <BentoItem
                        rowSpan={2}
                        title="Messages"
                        description="Recent conversations"
                        icon={<MessageSquare className="h-6 w-6 text-purple-500" />}
                    >
                        <div className="space-y-3 mt-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                    <div className="w-8 h-8 rounded-full bg-muted"></div>
                                    <div>
                                        <p className="text-sm font-medium">User {i}</p>
                                        <p className="text-xs text-muted-foreground">Latest message preview...</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </BentoItem>

                    <BentoItem
                        rowSpan={2}
                        title="Billing"
                        description="Manage your subscription"
                        icon={<CreditCard className="h-6 w-6 text-amber-500" />}
                    />

                    <BentoItem
                        title="Settings"
                        description="Configure your preferences"
                        icon={<Settings className="h-6 w-6 text-slate-500" />}
                    />

                    {/* Full width item */}
                    <BentoItem colSpan={3} title="Project Overview" description="Summary of all your current projects">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-4 rounded-lg bg-muted/50">
                                    <h4 className="font-medium">Project {i}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Progress: {i * 25}%</p>
                                    <div className="w-full h-2 bg-muted mt-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${i * 25}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </BentoItem>
                </BentoGrid>
            </IonContent>
        </IonPage>
    )
}
export default Page;