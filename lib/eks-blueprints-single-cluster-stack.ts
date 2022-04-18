import * as ec2 from "aws-cdk-lib/aws-ec2";
import { InstanceType } from 'aws-cdk-lib/aws-ec2';
import { KubernetesVersion, NodegroupAmiType } from 'aws-cdk-lib/aws-eks';
import * as cdk from 'aws-cdk-lib';
import { Construct } from "constructs";

import * as blueprints from '@aws-quickstart/eks-blueprints';
import * as team from '../teams';


const youngManifestDir = './teams/team-young/manifests/';
const andrewManifestDir = './teams/team-andrew/manifests/';
const teamManifestDirList = [andrewManifestDir, youngManifestDir];

export interface BlueprintConstructProps {
    /**
     * Id
     */
    id: string
}

export default class BlueprintsSingleClusterConstruct extends Construct {
    constructor(scope: Construct, blueprintProps: BlueprintConstructProps, props: cdk.StackProps) {
        super(scope, blueprintProps.id);

        // TODO: fix IAM user provisioning for admin user
        // Setup platform team.
        //const account = props.env!.account!
        // const platformTeam = new team.TeamPlatform(account)

        // Teams for the cluster.
        const teams: Array<blueprints.Team> = [
            new team.TeamYoung(
              scope,
              process.env.CDK_DEFAULT_ACCOUNT!,
              'jeong',
              teamManifestDirList[1]
            ),
            new team.TeamAndrew(
              scope,
              process.env.CDK_DEFAULT_ACCOUNT!,
              'jeong',
              teamManifestDirList[0]
            )
        ];

        const addOns: Array<blueprints.ClusterAddOn> = [
            new blueprints.addons.SSMAgentAddOn(),
            new blueprints.addons.ClusterAutoScalerAddOn(),
            new blueprints.addons.VpcCniAddOn(),
            new blueprints.addons.CalicoAddOn(),
        ];

        const clusterProvider = new blueprints.GenericClusterProvider({
            version: KubernetesVersion.V1_20,
            managedNodeGroups: [
                {
                    id: "mng1",
                    amiType: NodegroupAmiType.AL2_X86_64,
                    instanceTypes: [new InstanceType('m5.2xlarge')]
                },
            ]
        });

        blueprints.EksBlueprint.builder()
            .addOns(...addOns)
            .clusterProvider(clusterProvider)
            .teams(...teams)
            .enableControlPlaneLogTypes('api')
            .build(scope, blueprintProps.id, props);
    }
}