#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BackstageSampleStack } from '../lib/cdk-stack';

const app = new cdk.App();
new BackstageSampleStack(app, 'BackstageSampleStack', {});
